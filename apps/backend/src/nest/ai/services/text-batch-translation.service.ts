import { Inject, Injectable } from '@nestjs/common';
import { keyRoundRobin } from '@/nest/ai/utils/key-round-robin';
import { SourceLanguage, TargetLanguage } from '@apps/common/dist/language';
import { sleep } from '@/nest/utils/sleep';
import { ICacheManagerService } from '../../cache/cache-manager/services/i-cache-manager-service';
import { LoggerService } from '../../logger/logger.service';
import { ExampleManagerService } from '../../translation/example/services/example-manager.service';
import { AiTokenService } from './ai-token.service';
import { deepClone } from '@/nest/utils/deep-clone';
import { isNullish } from '@/nest/utils/is-nullish';
import { AiPromptConverterService } from './ai-prompt-converter.service';
import { textTranslationJsonSchema } from '@/nest/ai/schema/text-translation.schema';
import { AiProxyService } from './ai-proxy.service';
import { buildLanguageScopedCacheTag } from '@apps/common/dist/utils/cache-tag';
import { TranslatorAiSettings } from '@/nest/translator/common/dto/translator-settings.dto';
import { TranslationResult } from '@/nest/ai/types/translation-result.interface';
import { AiChatResponse, AiMessage, AiProxyError } from '../dto/common-ai.dto';
import type {
  PlaceholderPreservationSettings,
  StrictFailureReason,
  TextTranslateParam,
  TextTranslateResult,
} from './translator.types';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { TranslationParsingError } from './translation-response-parser.service';
import { getPlaceholderPreservationMismatchDetail } from './placeholder-preservation-validator';
import { containsLegacyTranslatedTextKey } from '@/nest/translation/prompt/utils/legacy-translated-text';

@Injectable()
export class TextBatchTranslationService {
  private readonly MAX_ATTEMPT_COUNT = 3;
  private readonly STABLE_BATCH_RECOVERY_THRESHOLD = 2;
  private readonly MAX_EXAMPLE_APPEND_CHAR_COUNT = 2000;

  constructor(
    @Inject(ICacheManagerService)
    private readonly cacheManagerService: ICacheManagerService,
    private readonly tokenService: AiTokenService,
    private readonly logger: LoggerService,
    private readonly exampleManagerService: ExampleManagerService,
    private readonly promptConverterService: AiPromptConverterService,
    private readonly aiProxy: AiProxyService,
    private readonly rateLimiterService: AiRateLimiterService
  ) {}

  public async translateText(param: TextTranslateParam): Promise<TextTranslateResult> {
    const {
      sourceTexts,
      promptPresetContent,
      aiSettings,
      cacheTag,
      onProgress,
      placeholderPreservation,
    } = param;
    const { sourceLanguage, targetLanguage, apiKey, customModelConfig, useThinking } = aiSettings;
    if (containsLegacyTranslatedTextKey(promptPresetContent)) {
      this.logger.warn(
        'legacy 키 translated_text가 포함된 promptPresetContent가 감지되었습니다. 현재 스키마는 text를 사용합니다.',
        {
          requestId: param.requestId,
        }
      );
    }
    const thinkingLevel = aiSettings.thinkingLevel?.trim();
    const effectiveUseThinking = !!thinkingLevel || useThinking;
    const normalizedCacheTag = buildLanguageScopedCacheTag(
      cacheTag,
      sourceLanguage,
      targetLanguage
    );
    const { maxOutputTokenCount, requestsPerMinute, modelName } = customModelConfig;

    await this.rateLimiterService.setRateLimiter(modelName, requestsPerMinute);
    const apiKeyIterator = keyRoundRobin(apiKey);
    if (!apiKeyIterator) throw new Error('API key is required for translation');

    const totalTexts = sourceTexts.length;

    try {
      const { texts, remainingTexts } = await this.applyTranslationCache(
        sourceTexts,
        normalizedCacheTag,
        placeholderPreservation
      );
      const pendingIndices = this.collectPendingIndices(remainingTexts);
      const appendableIndices = this.collectAppendableIndices(sourceTexts, pendingIndices);
      let exampleCursor = this.appendResolvedExamples({
        requestId: param.requestId,
        sourceTexts,
        translations: texts,
        sourceLanguage,
        targetLanguage,
        appendableIndices,
        pendingIndices,
        cursor: 0,
      });

      if (remainingTexts.size === 0) {
        onProgress?.({ completed: totalTexts, total: totalTexts });
        return {
          texts,
          strictMetaByIndex: this.buildStrictMetaByIndex(sourceTexts, new Map()),
        };
      }

      // 캐시 히트된 만큼 초기 진행률 보고
      const initialCompleted = totalTexts - remainingTexts.size;
      onProgress?.({ completed: initialCompleted, total: totalTexts });

      const newTranslations = new Map<string, TranslationResult>();
      const currentRemainingTexts = new Map(remainingTexts);
      let consecutiveFailures = 0;
      let intermediateTexts = [...texts];
      let maxBatchTextCount: number | null = null;
      let stableBatchSuccessCount = 0;
      const validationMismatchCounts = new Map<string, number>();
      const strictFailureReasonsByText = new Map<string, Set<StrictFailureReason>>();
      const persistedPlaceholderMismatchTexts = new Set<string>();

      while (currentRemainingTexts.size > 0) {
        const remainingTextArray = Array.from(currentRemainingTexts.keys());
        const batchGroups = await this.tokenService.getBatchGroups({
          texts: remainingTextArray,
          maxOutputTokenCount,
          useThinking: effectiveUseThinking,
        });

        const limitedBatchGroups = this.applyBatchSizeLimit(batchGroups, maxBatchTextCount);

        for (const batchTexts of limitedBatchGroups) {
          const batchRemainingTexts = new Map<string, number[]>();
          let shouldRestartBatching = false;

          try {
            for (const text of batchTexts) {
              const indices = currentRemainingTexts.get(text) || [];
              if (indices.length === 0) continue;
              batchRemainingTexts.set(text, indices);
              currentRemainingTexts.delete(text);
            }

            const {
              batchTranslations,
              response,
              shouldReduceBatchSize,
              hasPartialData,
              validationMismatchTexts,
            } = await this.translateUncachedTexts({
              requestId: param.requestId,
              remainingTexts: batchRemainingTexts,
              apiKeyIterator,
              promptPresetContent,
              aiSettings,
              cacheTag: normalizedCacheTag,
              placeholderPreservation,
            });

            const hasValidationMismatch = validationMismatchTexts.size > 0;
            const giveUpTexts = new Set<string>();
            if (hasValidationMismatch) {
              for (const text of validationMismatchTexts) {
                this.markStrictFailure(strictFailureReasonsByText, text, 'placeholder_mismatch');
                const nextCount = (validationMismatchCounts.get(text) ?? 0) + 1;
                validationMismatchCounts.set(text, nextCount);
                if (nextCount >= this.MAX_ATTEMPT_COUNT) {
                  giveUpTexts.add(text);
                }
              }
              if (giveUpTexts.size > 0) {
                for (const text of giveUpTexts) {
                  const indices = batchRemainingTexts.get(text) || [];
                  indices.forEach((index) => {
                    intermediateTexts[index] = text;
                  });
                  this.removePendingIndices(pendingIndices, indices);
                  batchRemainingTexts.delete(text);
                  currentRemainingTexts.delete(text);
                  validationMismatchCounts.delete(text);
                }
                this.logger.warn('검증 불일치가 반복되어 원문을 유지합니다.', {
                  count: giveUpTexts.size,
                });
                await this.persistPlaceholderMismatchFailureTexts({
                  texts: Array.from(giveUpTexts),
                  modelName,
                  cacheTag: normalizedCacheTag,
                  persistedTexts: persistedPlaceholderMismatchTexts,
                });
              }
              stableBatchSuccessCount = 0;
            }

            const madeProgress = batchTranslations.size > 0;
            let failureRecorded = false;
            if (hasPartialData) {
              failureRecorded = true;
              consecutiveFailures++;
              stableBatchSuccessCount = 0;
              this.logger.warn('부분 번역 응답이 감지되어 재시도합니다.', {
                batchSize: batchTexts.length,
                consecutiveFailures,
                finishReason: response.choices?.[0]?.finishReason,
                responseContent: response?.choices?.[0]?.message.content,
              });
              this.ensureFailureBudget(consecutiveFailures, 'PARTIAL_RESPONSE');
            }

            if (!failureRecorded) {
              if (madeProgress) {
                consecutiveFailures = 0;
              } else if (hasValidationMismatch) {
                consecutiveFailures = 0;
                stableBatchSuccessCount = 0;
                this.logger.warn('검증 불일치가 감지되어 재시도합니다.', {
                  batchSize: batchTexts.length,
                  mismatchCount: validationMismatchTexts.size,
                });
              } else {
                failureRecorded = true;
                consecutiveFailures++;
                stableBatchSuccessCount = 0;
                this.logger.warn('번역 응답이 비어 있어 재시도합니다.', {
                  batchSize: batchTexts.length,
                  consecutiveFailures,
                  finishReason: response.choices?.[0]?.finishReason,
                  responseContent: response?.choices?.[0]?.message.content,
                });
                this.ensureFailureBudget(consecutiveFailures, 'EMPTY_RESPONSE');
              }
            }

            for (const [originalText, result] of batchTranslations.entries()) {
              newTranslations.set(originalText, result);
              validationMismatchCounts.delete(originalText);
              this.clearStrictFailure(strictFailureReasonsByText, originalText);
            }

            if (madeProgress) {
              intermediateTexts = await this.updateTranslationsAndCache({
                newTranslations: new Map([...batchTranslations]),
                translations: intermediateTexts,
                modelName,
                cacheTag: normalizedCacheTag,
              });

              for (const { indices } of batchTranslations.values()) {
                this.removePendingIndices(pendingIndices, indices);
                this.addAppendableIndices(appendableIndices, indices);
              }

              // 진행률 보고: 완료된 텍스트 수 = 전체 - 남은 텍스트 수
              const completed = totalTexts - currentRemainingTexts.size;
              onProgress?.({ completed, total: totalTexts });
            }

            const missingTexts = batchTexts.filter((text) => !batchTranslations.has(text));
            const successTexts = batchTexts.filter((text) => batchTranslations.has(text));
            const finishReason = response.choices?.[0]?.finishReason;
            if (missingTexts.length > 0) {
              this.logger.debug('번역이 누락되었습니다.', {
                missingTexts,
                successTexts,
                finishReason,
                extra: {
                  choices: response.choices,
                  usage: response.usage,
                },
              });
            }

            for (const text of batchTexts) {
              if (giveUpTexts.has(text)) {
                continue;
              }
              if (!batchTranslations.has(text)) {
                const indices = batchRemainingTexts.get(text) || [];
                currentRemainingTexts.set(text, indices);
              }
            }

            exampleCursor = this.appendResolvedExamples({
              requestId: param.requestId,
              sourceTexts,
              translations: intermediateTexts,
              sourceLanguage,
              targetLanguage,
              appendableIndices,
              pendingIndices,
              cursor: exampleCursor,
            });

            if (shouldReduceBatchSize) {
              maxBatchTextCount = this.reduceBatchSizeLimit(maxBatchTextCount, batchTexts.length);
              shouldRestartBatching = true;
              stableBatchSuccessCount = 0;
            } else if (
              maxBatchTextCount !== null &&
              madeProgress &&
              !failureRecorded &&
              !hasValidationMismatch
            ) {
              stableBatchSuccessCount++;
              if (stableBatchSuccessCount >= this.STABLE_BATCH_RECOVERY_THRESHOLD) {
                this.logger.debug('배치 제한 해제 시도', {
                  previousLimit: maxBatchTextCount,
                });
                maxBatchTextCount = null;
                stableBatchSuccessCount = 0;
                shouldRestartBatching = true;
              }
            }
          } catch (error) {
            consecutiveFailures++;
            this.ensureFailureBudget(consecutiveFailures, error);

            if (error instanceof AiProxyError) {
              this.logger.error('번역 중 api 오류 발생:', {
                error,
                status: error.status,
                stack: error instanceof Error ? error.stack : undefined,
              });
              if (error.status === 429) {
                await sleep(10000);
              }
            } else {
              this.logger.error('번역 중 오류 발생:', {
                error,
                stack: error instanceof Error ? error.stack : undefined,
              });
            }

            if (error instanceof TranslationParsingError && error.shouldReduceBatchSize) {
              maxBatchTextCount = this.reduceBatchSizeLimit(maxBatchTextCount, batchTexts.length);
              shouldRestartBatching = true;
              stableBatchSuccessCount = 0;
            }

            for (const [originalText, indices] of batchRemainingTexts.entries()) {
              if (!newTranslations.has(originalText)) {
                currentRemainingTexts.set(originalText, indices);
              }
            }
          }

          if (shouldRestartBatching) {
            break;
          }
        }
      }

      for (const [originalText, indices] of currentRemainingTexts.entries()) {
        this.markStrictFailure(strictFailureReasonsByText, originalText, 'unresolved_segment');
        indices.forEach((index) => {
          intermediateTexts[index] = originalText;
        });
        this.removePendingIndices(pendingIndices, indices);
        newTranslations.set(originalText, { text: originalText, indices });
      }

      this.appendResolvedExamples({
        requestId: param.requestId,
        sourceTexts,
        translations: intermediateTexts,
        sourceLanguage,
        targetLanguage,
        appendableIndices,
        pendingIndices,
        cursor: exampleCursor,
      });

      await this.persistPlaceholderMismatchFailures({
        sourceTexts,
        strictFailureReasonsByText,
        modelName,
        cacheTag: normalizedCacheTag,
        persistedTexts: persistedPlaceholderMismatchTexts,
      });

      if (strictFailureReasonsByText.size > 0) {
        this.logger.warn('엄격 검증 실패를 포함해 번역을 종료합니다.', {
          strictFailureTextCount: strictFailureReasonsByText.size,
        });
      } else {
        this.logger.debug('완전 번역 완료:', {
          newTranslations,
          intermediateTexts,
        });
      }

      return {
        texts: intermediateTexts,
        strictMetaByIndex: this.buildStrictMetaByIndex(sourceTexts, strictFailureReasonsByText),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Translation failed: ${errorMessage}`);
    }
  }

  private ensureFailureBudget(consecutiveFailures: number, error?: unknown): void {
    if (consecutiveFailures < this.MAX_ATTEMPT_COUNT) {
      return;
    }
    const message = `번역이 연속으로 ${this.MAX_ATTEMPT_COUNT}회 실패하여 중단합니다.`;
    this.logger.error(message, {
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(message);
  }

  private markStrictFailure(
    strictFailureReasonsByText: Map<string, Set<StrictFailureReason>>,
    text: string,
    reason: StrictFailureReason
  ): void {
    const existing = strictFailureReasonsByText.get(text);
    if (existing) {
      existing.add(reason);
      return;
    }
    strictFailureReasonsByText.set(text, new Set([reason]));
  }

  private clearStrictFailure(
    strictFailureReasonsByText: Map<string, Set<StrictFailureReason>>,
    text: string
  ): void {
    strictFailureReasonsByText.delete(text);
  }

  private buildStrictMetaByIndex(
    sourceTexts: string[],
    strictFailureReasonsByText: Map<string, Set<StrictFailureReason>>
  ): TextTranslateResult['strictMetaByIndex'] {
    return sourceTexts.map((text) => {
      const reasons = Array.from(strictFailureReasonsByText.get(text) ?? []).sort();
      return {
        strictFailed: reasons.length > 0,
        strictFailureReasons: reasons,
        strictFailureCount: reasons.length,
      };
    });
  }

  private async persistPlaceholderMismatchFailures({
    sourceTexts,
    strictFailureReasonsByText,
    modelName,
    cacheTag,
    persistedTexts,
  }: {
    sourceTexts: string[];
    strictFailureReasonsByText: Map<string, Set<StrictFailureReason>>;
    modelName: string;
    cacheTag: string;
    persistedTexts: Set<string>;
  }): Promise<void> {
    const textsToPersist: string[] = [];

    for (const text of sourceTexts) {
      if (persistedTexts.has(text)) {
        continue;
      }
      const reasons = strictFailureReasonsByText.get(text);
      if (!reasons?.has('placeholder_mismatch')) {
        continue;
      }
      textsToPersist.push(text);
    }

    await this.persistPlaceholderMismatchFailureTexts({
      texts: textsToPersist,
      modelName,
      cacheTag,
      persistedTexts,
    });
  }

  private async persistPlaceholderMismatchFailureTexts({
    texts,
    modelName,
    cacheTag,
    persistedTexts,
  }: {
    texts: string[];
    modelName: string;
    cacheTag: string;
    persistedTexts: Set<string>;
  }): Promise<void> {
    const uniqueTexts = texts.filter((text) => !persistedTexts.has(text));

    if (uniqueTexts.length === 0) {
      return;
    }

    for (const text of uniqueTexts) {
      await this.cacheManagerService.setTranslation(
        text,
        text,
        false,
        modelName,
        cacheTag,
        'placeholder_mismatch'
      );
      persistedTexts.add(text);
    }

    this.logger.debug('플레이스홀더 불일치 실패를 캐시에 기록했습니다.', {
      count: uniqueTexts.length,
      cacheTag,
    });
  }

  private async translateUncachedTexts({
    requestId,
    remainingTexts,
    apiKeyIterator,
    aiSettings,
    promptPresetContent,
    cacheTag,
    placeholderPreservation,
  }: {
    requestId: string;
    remainingTexts: Map<string, number[]>;
    apiKeyIterator: Generator<string>;
    aiSettings: TranslatorAiSettings;
    promptPresetContent: string;
    cacheTag: string;
    placeholderPreservation?: PlaceholderPreservationSettings;
  }): Promise<{
    batchTranslations: Map<string, TranslationResult>;
    response: AiChatResponse;
    shouldReduceBatchSize: boolean;
    hasPartialData: boolean;
    validationMismatchTexts: Set<string>;
  }> {
    const {
      sourceLanguage,
      targetLanguage,
      customModelConfig: { maxOutputTokenCount, modelName },
    } = aiSettings;
    try {
      const rateLimiter = await this.rateLimiterService.getRateLimiter(modelName);
      await rateLimiter.removeTokens(1);
      const next = apiKeyIterator.next();
      const apiKey = !next.done ? (next.value as string) : undefined;
      if (!apiKey) throw new Error('API key is required');
      const { messages, idToOriginalText } =
        await this.promptConverterService.getChatBlockWithSegmentMap({
          requestId,
          content: Array.from(remainingTexts.keys()),
          sourceLanguage,
          targetLanguage,
          promptPresetContent,
        });

      this.logger.debug('번역 요청 전 프롬프트:', {
        messages,
      });

      const thinkingConfig = this.buildThinkingConfig(aiSettings);
      const response = await this.aiProxy.chat({
        aiSettings,
        apiKey,
        request: {
          model: modelName,
          messages: this.castMessagesToAi(messages as Array<{ role: string; content: unknown }>),
          temperature: 0.5,
          maxTokens: maxOutputTokenCount,
          topP: 0.95,
          responseFormat: { type: 'json_schema', jsonSchema: textTranslationJsonSchema },
          thinking: thinkingConfig,
        },
      });

      const {
        translations: batchTranslations,
        hasPartialData,
        validationMismatchTexts,
      } = await this.aiProxy.parseTranslationResponse(
        response,
        remainingTexts,
        idToOriginalText,
        placeholderPreservation
      );
      return {
        batchTranslations,
        response,
        shouldReduceBatchSize: this.aiProxy.isFinishedByMaxTokens(response) || hasPartialData,
        hasPartialData,
        validationMismatchTexts,
      };
    } catch (error) {
      const translationsToCache = new Map<string, string>();

      for (const [text] of remainingTexts) {
        translationsToCache.set(text, '');
      }

      await this.cacheManagerService.setTranslations(
        translationsToCache,
        false,
        modelName,
        cacheTag
      );

      throw error;
    }
  }

  private applyBatchSizeLimit(batchGroups: string[][], maxBatchSize: number | null): string[][] {
    if (!maxBatchSize || maxBatchSize < 1) {
      return batchGroups;
    }

    const limitedGroups: string[][] = [];
    for (const group of batchGroups) {
      if (group.length <= maxBatchSize) {
        limitedGroups.push(group);
        continue;
      }

      for (let i = 0; i < group.length; i += maxBatchSize) {
        limitedGroups.push(group.slice(i, i + maxBatchSize));
      }
    }

    return limitedGroups;
  }

  private reduceBatchSizeLimit(currentLimit: number | null, previousBatchSize: number): number {
    const candidate = Math.max(1, Math.floor(previousBatchSize / 4));
    if (currentLimit === null) {
      return candidate;
    }
    return Math.min(currentLimit, candidate);
  }

  private buildThinkingConfig(aiSettings: TranslatorAiSettings) {
    const thinkingLevel = aiSettings.thinkingLevel?.trim();
    if (thinkingLevel) {
      return {
        enabled: true,
        useCustomBudget: false,
        thinkingLevel,
      };
    }
    return {
      enabled: !!aiSettings.useThinking,
      useCustomBudget: !!aiSettings.setThinkingBudget,
      budget: aiSettings.thinkingBudget,
    };
  }

  public async getEstimatedTokenCount(texts: string[] | string): Promise<number> {
    return await this.tokenService.getEstimatedTokenCount(texts);
  }

  private async applyTranslationCache(
    sourceTexts: string[],
    cacheTag: string,
    placeholderPreservation?: PlaceholderPreservationSettings
  ): Promise<{
    texts: string[];
    remainingTexts: Map<string, number[]>;
  }> {
    const texts = new Array<string>(sourceTexts.length);
    const remainingTexts = new Map<string, number[]>();
    const cachedResults = await this.cacheManagerService.getTranslations(sourceTexts, cacheTag);

    sourceTexts.forEach((text, index) => {
      const { translatedText, isCacheHit } = this.getTranslationFromCachedResult(
        text,
        cachedResults,
        placeholderPreservation
      );

      if (isCacheHit) {
        texts[index] = translatedText;
      } else {
        const indices = remainingTexts.get(text) || [];
        indices.push(index);
        remainingTexts.set(text, indices);
      }
    });

    return { texts, remainingTexts };
  }

  private collectPendingIndices(remainingTexts: Map<string, number[]>): Set<number> {
    const pendingIndices = new Set<number>();

    for (const indices of remainingTexts.values()) {
      for (const index of indices) {
        pendingIndices.add(index);
      }
    }

    return pendingIndices;
  }

  private collectAppendableIndices(
    sourceTexts: string[],
    pendingIndices: Set<number>
  ): Set<number> {
    const appendableIndices = new Set<number>();

    sourceTexts.forEach((text, index) => {
      if (!pendingIndices.has(index) && text.trim() !== '') {
        appendableIndices.add(index);
      }
    });

    return appendableIndices;
  }

  private removePendingIndices(pendingIndices: Set<number>, indices: number[]): void {
    for (const index of indices) {
      pendingIndices.delete(index);
    }
  }

  private addAppendableIndices(appendableIndices: Set<number>, indices: number[]): void {
    for (const index of indices) {
      appendableIndices.add(index);
    }
  }

  private appendResolvedExamples({
    requestId,
    sourceTexts,
    translations,
    sourceLanguage,
    targetLanguage,
    appendableIndices,
    pendingIndices,
    cursor,
  }: {
    requestId: string;
    sourceTexts: string[];
    translations: string[];
    sourceLanguage: SourceLanguage;
    targetLanguage: TargetLanguage;
    appendableIndices: Set<number>;
    pendingIndices: Set<number>;
    cursor: number;
  }): number {
    let sources: string[] = [];
    let results: string[] = [];
    let bufferedSourceCharCount = 0;
    let nextCursor = cursor;

    const flush = () => {
      if (sources.length === 0) {
        return;
      }

      this.exampleManagerService.appendCurrentExample(
        requestId,
        sourceLanguage,
        targetLanguage,
        sources,
        results
      );

      sources = [];
      results = [];
      bufferedSourceCharCount = 0;
    };

    while (nextCursor < sourceTexts.length && !pendingIndices.has(nextCursor)) {
      const sourceText = sourceTexts[nextCursor];
      const translatedText = translations[nextCursor];

      if (appendableIndices.has(nextCursor) && sourceText.trim() !== '') {
        if (
          sources.length > 0 &&
          bufferedSourceCharCount + sourceText.length > this.MAX_EXAMPLE_APPEND_CHAR_COUNT
        ) {
          flush();
        }

        sources.push(sourceText);
        results.push(translatedText);
        bufferedSourceCharCount += sourceText.length;
        appendableIndices.delete(nextCursor);
      }

      nextCursor++;
    }

    flush();

    return nextCursor;
  }

  private getTranslationFromCachedResult(
    originalText: string,
    cachedResults: Map<string, string | null>,
    placeholderPreservation?: PlaceholderPreservationSettings
  ): { translatedText: string; isCacheHit: boolean } {
    if (originalText.trim() === '') return { translatedText: originalText, isCacheHit: true };

    const cachedTranslation = cachedResults.get(originalText);
    if (!isNullish(cachedTranslation)) {
      const normalizedOriginal = originalText.trim();
      const normalizedTranslated = cachedTranslation.trim();
      if (
        placeholderPreservation?.enabled &&
        Array.isArray(placeholderPreservation.rules) &&
        placeholderPreservation.rules.length > 0
      ) {
        const mismatchDetail = getPlaceholderPreservationMismatchDetail({
          beforeText: normalizedOriginal,
          afterText: normalizedTranslated,
          placeholderPreservation,
          warn: (message, meta) => this.logger.warn(message, meta),
        });
        if (mismatchDetail) {
          this.logger.warn('캐시 번역 플레이스홀더 보존 불일치로 재번역합니다.', {
            originalText,
            cachedTranslation,
            originalLength: normalizedOriginal.length,
            translatedLength: normalizedTranslated.length,
            placeholderMismatch: mismatchDetail,
          });
          return { translatedText: originalText, isCacheHit: false };
        }
      }
    }
    const translatedText = isNullish(cachedTranslation) ? originalText : cachedTranslation;
    const isCacheHit = !isNullish(cachedTranslation);

    return { translatedText, isCacheHit };
  }

  private async updateTranslationsAndCache({
    newTranslations,
    translations,
    modelName,
    cacheTag,
  }: {
    newTranslations: Map<string, TranslationResult>;
    translations: string[];
    modelName: string;
    cacheTag: string;
  }): Promise<string[]> {
    const translationsToCache = new Map<string, string>();
    const copiedTranslations = deepClone(translations);

    for (const [originalText, { text: translatedText, indices }] of newTranslations) {
      translationsToCache.set(originalText, translatedText);

      indices.forEach((index) => {
        copiedTranslations[index] = translatedText;
      });
    }

    await this.cacheManagerService.setTranslations(translationsToCache, true, modelName, cacheTag);

    return copiedTranslations;
  }

  private castMessagesToAi(
    messages: ReadonlyArray<{ role: string; content?: unknown }>
  ): AiMessage[] {
    return messages.map((m) => ({
      role: (m.role as AiMessage['role']) || 'user',
      content: this.castContentToAi(m.content),
    }));
  }

  private castContentToAi(content: unknown | undefined): AiMessage['content'] {
    if (typeof content === 'string') return content;
    if (!Array.isArray(content)) return '';
    const parts: Array<{ type: 'text'; text: string } | { type: 'image'; imageUrl: string }> = [];
    for (const raw of content as unknown[]) {
      if (raw && typeof raw === 'object' && 'type' in (raw as Record<string, unknown>)) {
        const part = raw as {
          type: string;
          text?: unknown;
          image_url?: { url?: unknown };
        };
        if (part.type === 'text' && typeof part.text === 'string') {
          parts.push({ type: 'text', text: part.text });
        } else if (
          part.type === 'image_url' &&
          part.image_url &&
          typeof part.image_url.url === 'string'
        ) {
          parts.push({ type: 'image', imageUrl: part.image_url.url });
        }
      }
    }
    return parts;
  }
}
