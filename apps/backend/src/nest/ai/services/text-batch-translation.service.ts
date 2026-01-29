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
import type { PlaceholderPreservationSettings, TextTranslateParam } from './translator.types';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { TranslationParsingError } from './translation-response-parser.service';

@Injectable()
export class TextBatchTranslationService {
  private readonly MAX_ATTEMPT_COUNT = 3;
  private readonly STABLE_BATCH_RECOVERY_THRESHOLD = 2;

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

  public async translateText(param: TextTranslateParam): Promise<string[]> {
    const {
      sourceTexts,
      promptPresetContent,
      aiSettings,
      cacheTag,
      onProgress,
      placeholderPreservation,
    } = param;
    const { sourceLanguage, targetLanguage, apiKey, customModelConfig, useThinking } = aiSettings;
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

      if (remainingTexts.size === 0) {
        onProgress?.({ completed: totalTexts, total: totalTexts });
        return texts;
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
                  batchRemainingTexts.delete(text);
                  currentRemainingTexts.delete(text);
                  validationMismatchCounts.delete(text);
                }
                this.logger.warn('검증 불일치가 반복되어 원문을 유지합니다.', {
                  count: giveUpTexts.size,
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
            }

            if (madeProgress) {
              intermediateTexts = await this.updateTranslationsAndCache({
                requestId: param.requestId,
                newTranslations: new Map([...batchTranslations]),
                translations: intermediateTexts,
                sourceLanguage,
                targetLanguage,
                modelName,
                cacheTag: normalizedCacheTag,
              });

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
        newTranslations.set(originalText, { text: originalText, indices });
      }

      this.logger.debug('완전 번역 완료:', {
        newTranslations,
        intermediateTexts,
      });

      return intermediateTexts;
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
        const mismatch = this.hasPlaceholderPreservationMismatch({
          beforeText: normalizedOriginal,
          afterText: normalizedTranslated,
          placeholderPreservation,
        });
        if (mismatch) {
          this.logger.warn('캐시 번역 플레이스홀더 보존 불일치로 재번역합니다.', {
            originalLength: normalizedOriginal.length,
            translatedLength: normalizedTranslated.length,
          });
          return { translatedText: originalText, isCacheHit: false };
        }
      }
    }
    const translatedText = isNullish(cachedTranslation) ? originalText : cachedTranslation;
    const isCacheHit = !isNullish(cachedTranslation);

    return { translatedText, isCacheHit };
  }

  private hasPlaceholderPreservationMismatch({
    beforeText,
    afterText,
    placeholderPreservation,
  }: {
    beforeText: string;
    afterText: string;
    placeholderPreservation: PlaceholderPreservationSettings;
  }): boolean {
    for (const rule of placeholderPreservation.rules) {
      if (!rule || typeof rule.pattern !== 'string') continue;
      const pattern = rule.pattern;
      if (!pattern.trim()) continue;
      const flags = typeof rule.flags === 'string' ? rule.flags : '';
      const compiled = this.safeCompileRule(pattern, flags);
      if (!compiled) continue;
      const before = this.safeBuildMatchMultiset(beforeText, compiled);
      const after = this.safeBuildMatchMultiset(afterText, compiled);
      if (before.kind !== 'ok' || after.kind !== 'ok') {
        return true;
      }
      if (!this.isSameMatchMultiset(before.multiset, after.multiset)) return true;
    }
    return false;
  }

  private safeCompileRule(pattern: string, flags: string): RegExp | null {
    try {
      const normalizedFlags = this.normalizeFlagsForCounting(flags);
      return new RegExp(pattern, normalizedFlags);
    } catch (error) {
      this.logger.warn('플레이스홀더 정규식 컴파일 실패로 규칙을 무시합니다.', {
        pattern,
        flags,
        error,
      });
      return null;
    }
  }

  private normalizeFlagsForCounting(flags: string): string {
    const raw = typeof flags === 'string' ? flags : '';
    const filtered = raw.replace(/[^dgimsuvy]/g, '');
    const unique = Array.from(new Set(filtered.split(''))).join('');
    return unique.includes('g') ? unique : `${unique}g`;
  }

  private isSameMatchMultiset(a: Map<string, number>, b: Map<string, number>): boolean {
    if (a.size !== b.size) return false;
    for (const [value, count] of a) {
      if (b.get(value) !== count) return false;
    }
    return true;
  }

  private safeBuildMatchMultiset(
    text: string,
    regex: RegExp
  ): { kind: 'ok'; multiset: Map<string, number> } | { kind: 'too_many' } | { kind: 'error' } {
    try {
      const maxMatches = 10000;
      let count = 0;
      const multiset = new Map<string, number>();
      regex.lastIndex = 0;
      while (true) {
        const match = regex.exec(text);
        if (!match) break;
        const value = match[0];
        multiset.set(value, (multiset.get(value) || 0) + 1);
        count++;
        if (count >= maxMatches) {
          this.logger.warn('플레이스홀더 매칭이 너무 많아 검증에 실패합니다.', {
            maxMatches,
          });
          return { kind: 'too_many' };
        }
        if (value === '') {
          regex.lastIndex++;
          if (regex.lastIndex > text.length) break;
        }
      }
      return { kind: 'ok', multiset };
    } catch (error) {
      this.logger.warn('플레이스홀더 매칭 카운트 실패로 검증에 실패합니다.', { error });
      return { kind: 'error' };
    }
  }

  private async updateTranslationsAndCache({
    requestId,
    newTranslations,
    translations,
    sourceLanguage,
    targetLanguage,
    modelName,
    cacheTag,
  }: {
    requestId: string;
    newTranslations: Map<string, TranslationResult>;
    translations: string[];
    sourceLanguage: SourceLanguage;
    targetLanguage: TargetLanguage;
    modelName: string;
    cacheTag: string;
  }): Promise<string[]> {
    const translationsToCache = new Map<string, string>();
    const sourceLines: string[] = [];
    const resultLines: string[] = [];
    const copiedTranslations = deepClone(translations);

    for (const [originalText, { text: translatedText, indices }] of newTranslations) {
      translationsToCache.set(originalText, translatedText);

      indices.forEach((index) => {
        copiedTranslations[index] = translatedText;
      });

      sourceLines.push(originalText);
      resultLines.push(translatedText);
    }

    await this.cacheManagerService.setTranslations(translationsToCache, true, modelName, cacheTag);

    if (sourceLines.length > 0) {
      this.exampleManagerService.appendCurrentExample(
        requestId,
        sourceLanguage,
        targetLanguage,
        sourceLines,
        resultLines
      );
    }

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
