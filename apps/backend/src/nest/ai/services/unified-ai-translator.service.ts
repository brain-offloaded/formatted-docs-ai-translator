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
import { RateLimiter } from 'limiter';
import { AiPromptConverterService } from './ai-prompt-converter.service';
import { imageOcrTranslationJsonSchema } from '@/nest/ai/schema/image-ocr-translation.schema';
import { textTranslationJsonSchema } from '@/nest/ai/schema/text-translation.schema';
import { AiProxyService, TranslationParsingError } from './ai-proxy.service';
import { buildLanguageScopedCacheTag } from '@apps/common/dist/utils/cache-tag';
import { TranslatorAiSettings } from '@/nest/translator/common/dto/translator-settings.dto';
import { TranslationResult } from '@/nest/ai/types/translation-result.interface';
import {
  AiChatRequest,
  AiChatResponse,
  AiMessage,
  AiProxyError,
  toTextFromMessageContent,
} from '../dto/common-ai.dto';
import { ImageOcrTranslationResultDto } from '@/nest/translator/image/dto/response/translate-image-response.dto';

export interface TextTranslateParam {
  requestId: string;
  sourceTexts: string[];
  promptPresetContent: string;
  aiSettings: TranslatorAiSettings;
  cacheTag: string;
}

export interface ImageTranslateParam {
  requestId: string;
  fileName?: string;
  imageData: string; // base64 encoded image data
  promptPresetContent: string;
  aiSettings: TranslatorAiSettings;
  cacheTag?: string;
}

export type TranslateParam = TextTranslateParam | ImageTranslateParam;

@Injectable()
export class UnifiedAiTranslatorService {
  protected rateLimiterMapping: Map<string, RateLimiter> = new Map();
  private readonly MAX_ATTEMPT_COUNT = 3;
  private readonly STABLE_BATCH_RECOVERY_THRESHOLD = 2;
  constructor(
    @Inject(ICacheManagerService)
    protected readonly cacheManagerService: ICacheManagerService,
    private readonly tokenService: AiTokenService,
    // AiResponseService 기능은 AiProxyService로 통합됨
    private readonly logger: LoggerService,
    protected readonly exampleManagerService: ExampleManagerService,
    private readonly promptConverterService: AiPromptConverterService,
    private readonly aiProxy: AiProxyService
  ) {}

  public async translate(param: TextTranslateParam): Promise<string[]>;
  public async translate(param: ImageTranslateParam): Promise<ImageOcrTranslationResultDto>;
  public async translate(param: TranslateParam): Promise<string[] | ImageOcrTranslationResultDto> {
    if ('sourceTexts' in param) {
      return this.translateText(param);
    } else {
      const imageParam = param as ImageTranslateParam;
      if (!imageParam.fileName && !imageParam.imageData) {
        throw new Error('Either file path or image data is required for image translation.');
      }

      return this.translateImage(imageParam);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async logPrompt(params: { messages: any }) {
    const s = JSON.stringify(params.messages);
    const front = s.substring(0, s.indexOf('data:image/jpeg;base64,'));
    const back = s.substring(
      s.indexOf('"', s.indexOf('data:image/jpeg;base64,') + 'data:image/jpeg;base64,'.length)
    );
    const middle = 'this is image';
    const messages = JSON.parse(`${front}${middle}${back}`);

    this.logger.debug('번역 요청 전 프롬프트:', {
      messages,
    });
  }

  private async translateImage(param: ImageTranslateParam): Promise<ImageOcrTranslationResultDto> {
    const {
      requestId,
      fileName = 'temp-file',
      imageData,
      promptPresetContent,
      aiSettings,
      cacheTag,
    } = param;
    const {
      customModelConfig: { maxOutputTokenCount, modelName, requestsPerMinute },
    } = aiSettings;

    const cacheKey = await this.cacheManagerService.getCacheKeyFromImage(imageData);
    const normalizedCacheTag = buildLanguageScopedCacheTag(
      cacheTag ?? '',
      aiSettings.sourceLanguage,
      aiSettings.targetLanguage
    );
    await this.setRateLimiter(modelName, requestsPerMinute);

    const cachedResult = await this.cacheManagerService.getTranslation(
      cacheKey,
      normalizedCacheTag
    );
    if (cachedResult) {
      this.logger.debug(`[UnifiedAiTranslatorService] Cache hit for image ${fileName}`);
      return JSON.parse(cachedResult);
    }

    this.logger.debug(
      `[UnifiedAiTranslatorService] Cache miss for image ${fileName}. Translating...`
    );

    const dataUrl = `data:image/jpeg;base64,${imageData}`;

    const messages = await this.promptConverterService.getChatBlock({
      requestId,
      content: 'dataUrl', // NOTE: 현재 getChatBlock은 content에 이미지 url을 넣는 것을 지원하지 않음. 추후 수정 필요
      sourceLanguage: aiSettings.sourceLanguage, // TODO: 이미지 번역 시 언어 감지 또는 설정 필요
      targetLanguage: aiSettings.targetLanguage,
      promptPresetContent,
      imageDataUrl: dataUrl,
    });

    const iter = keyRoundRobin(aiSettings.apiKey);
    if (!iter) throw new Error('API key is required for image translation');
    const firstKey = iter.next();
    const apiKey = !firstKey.done ? (firstKey.value as string) : undefined;
    if (!apiKey) throw new Error('API key is required for image translation');

    const rateLimiter = await this.getRateLimiter(modelName);
    await rateLimiter.removeTokens(1);

    // this.logger.debug('번역 요청 전 프롬프트:', {
    //   messages,
    // });
    this.logPrompt({ messages });
    const response = await this.aiProxy.chat({
      aiSettings,
      apiKey,
      request: {
        model: modelName,
        messages: this.castMessagesToAi(messages),
        responseFormat: { type: 'json_schema', jsonSchema: imageOcrTranslationJsonSchema },
        temperature: 0.5,
        maxTokens: maxOutputTokenCount,
        topP: 0.95,
      },
    });

    const content = toTextFromMessageContent(response.choices[0].message.content);
    this.logger.debug(`[UnifiedAiTranslatorService] content in response for image ${fileName}`, {
      response,
      length: response.choices.length,
      chocies: response.choices,
      messages: response.choices.map((choice) => choice.message),
      contents: response.choices.map((choice) => choice.message.content),
    });
    if (!content) {
      throw new Error('Failed to get translation from AI');
    }

    const result = JSON.parse(content) as ImageOcrTranslationResultDto;

    await this.cacheManagerService.setTranslation(
      cacheKey,
      JSON.stringify(result),
      true,
      modelName,
      normalizedCacheTag
    );

    return result;
  }

  private async translateText(param: TextTranslateParam): Promise<string[]> {
    const { sourceTexts, promptPresetContent, aiSettings, cacheTag } = param;
    const { sourceLanguage, targetLanguage, apiKey, customModelConfig, useThinking } = aiSettings;
    const normalizedCacheTag = buildLanguageScopedCacheTag(
      cacheTag,
      sourceLanguage,
      targetLanguage
    );
    const { maxOutputTokenCount, requestsPerMinute, modelName } = customModelConfig;
    this.setRateLimiter(modelName, requestsPerMinute);
    const apiKeyIterator = keyRoundRobin(apiKey);
    if (!apiKeyIterator) throw new Error('API key is required for translation');

    try {
      const { texts, remainingTexts } = await this.applyTranslationCache(
        sourceTexts,
        normalizedCacheTag
      );

      if (remainingTexts.size > 0) {
        const newTranslations = new Map<string, TranslationResult>();
        const currentRemainingTexts = new Map(remainingTexts);
        let consecutiveFailures = 0;
        let intermediateTexts = [...texts];
        let maxBatchTextCount: number | null = null;
        let stableBatchSuccessCount = 0;

        while (currentRemainingTexts.size > 0) {
          const remainingTextArray = Array.from(currentRemainingTexts.keys());
          const batchGroups = await this.tokenService.getBatchGroups({
            texts: remainingTextArray,
            maxOutputTokenCount,
            useThinking,
          });

          const limitedBatchGroups = this.applyBatchSizeLimit(batchGroups, maxBatchTextCount);

          for (const batchTexts of limitedBatchGroups) {
            const batchRemainingTexts = new Map<string, number[]>();
            let shouldRestartBatching = false;

            try {
              for (const text of batchTexts) {
                const indices = currentRemainingTexts.get(text) || [];
                if (indices.length == 0) continue;
                batchRemainingTexts.set(text, indices);
                currentRemainingTexts.delete(text);
              }

              const { batchTranslations, response, shouldReduceBatchSize, hasPartialData } =
                await this.translateUncachedTexts({
                  requestId: param.requestId,
                  remainingTexts: batchRemainingTexts,
                  apiKeyIterator,
                  promptPresetContent,
                  aiSettings,
                  cacheTag: normalizedCacheTag,
                });

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
              }

              // 배치 번역 성공 후 중간 결과 즉시 업데이트 및 캐싱
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
              }

              const missingTexts = batchTexts.filter((text) => !batchTranslations.has(text));
              const successTexts = batchTexts.filter((text) => batchTranslations.has(text));
              const finishReason = response.choices?.[0]?.finishReason;
              if (missingTexts.length > 0) {
                this.logger.debug(`번역이 누락되었습니다.`, {
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
                if (!batchTranslations.has(text)) {
                  const indices = batchRemainingTexts.get(text) || [];
                  currentRemainingTexts.set(text, indices);
                }
              }

              if (shouldReduceBatchSize) {
                maxBatchTextCount = this.reduceBatchSizeLimit(maxBatchTextCount, batchTexts.length);
                shouldRestartBatching = true;
                stableBatchSuccessCount = 0;
              } else if (maxBatchTextCount !== null && madeProgress && !failureRecorded) {
                stableBatchSuccessCount++;
                if (stableBatchSuccessCount >= this.STABLE_BATCH_RECOVERY_THRESHOLD) {
                  this.logger.debug('배치 제한 해제 시도', {
                    previousLimit: maxBatchTextCount,
                  });
                  maxBatchTextCount = null;
                  stableBatchSuccessCount = 0;
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
      }

      return texts;
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

  // Convert OpenAI-like messages from prompt converter to provider-agnostic messages
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
        // ignore other part types (e.g., input_audio, tool, etc.)
      }
    }
    return parts;
  }

  //

  protected async translateUncachedTexts({
    requestId,
    remainingTexts,
    apiKeyIterator,
    aiSettings,
    promptPresetContent,
    cacheTag,
  }: {
    requestId: string;
    remainingTexts: Map<string, number[]>;
    apiKeyIterator: Generator<string>;
    aiSettings: TranslatorAiSettings;
    promptPresetContent: string;
    cacheTag: string;
  }): Promise<{
    batchTranslations: Map<string, TranslationResult>;
    response: AiChatResponse;
    shouldReduceBatchSize: boolean;
    hasPartialData: boolean;
  }> {
    const {
      sourceLanguage,
      targetLanguage,
      customModelConfig: { maxOutputTokenCount, modelName },
    } = aiSettings;
    try {
      const rateLimiter = await this.getRateLimiter(modelName);
      await rateLimiter.removeTokens(1);
      const next = apiKeyIterator.next();
      const apiKey = !next.done ? (next.value as string) : undefined;
      if (!apiKey) throw new Error('API key is required');
      const messages = await this.promptConverterService.getChatBlock({
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

      const { translations: batchTranslations, hasPartialData } =
        await this.aiProxy.parseTranslationResponse(response, remainingTexts);
      return {
        batchTranslations,
        response,
        shouldReduceBatchSize: this.aiProxy.isFinishedByMaxTokens(response) || hasPartialData,
        hasPartialData,
      };
    } catch (error) {
      // 번역 실패 처리
      const translationsToCache = new Map<string, string>();

      for (const [text] of remainingTexts) {
        translationsToCache.set(text, '');
      }

      // 실패한 번역도 캐시에 저장 (success: false) - 이제 자동으로 이력도 생성됨
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

  private buildThinkingConfig(aiSettings: TranslatorAiSettings): AiChatRequest['thinking'] {
    return {
      enabled: !!aiSettings.useThinking,
      useCustomBudget: !!aiSettings.setThinkingBudget,
      budget: aiSettings.thinkingBudget,
    };
  }

  public async getEstimatedTokenCount(texts: string[] | string): Promise<number> {
    return await this.tokenService.getEstimatedTokenCount(texts);
  }

  protected async setRateLimiter(modelName: string, requestsPerMinute: number): Promise<void> {
    if (this.rateLimiterMapping.has(modelName)) return;

    this.rateLimiterMapping.set(
      modelName,
      new RateLimiter({
        tokensPerInterval: requestsPerMinute,
        interval: 'minute',
      })
    );
  }

  protected async getRateLimiter(modelName: string): Promise<RateLimiter> {
    if (!this.rateLimiterMapping.has(modelName)) await this.setRateLimiter(modelName, 100);
    return this.rateLimiterMapping.get(modelName)!;
  }

  protected async applyTranslationCache(
    sourceTexts: string[],
    cacheTag: string
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
        cachedResults
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

  protected getTranslationFromCachedResult(
    originalText: string,
    cachedResults: Map<string, string | null>
  ): { translatedText: string; isCacheHit: boolean } {
    if (originalText.trim() === '') return { translatedText: originalText, isCacheHit: true };

    const cachedTranslation = cachedResults.get(originalText);
    const translatedText = isNullish(cachedTranslation) ? originalText : cachedTranslation;
    const isCacheHit = !isNullish(cachedTranslation);

    return { translatedText, isCacheHit };
  }

  protected async updateTranslationsAndCache({
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

    // 번역 저장 - 이제 자동으로 이력도 생성됨
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
}
