import {
  GenerativeModel,
  GoogleGenerativeAI,
  EnhancedGenerateContentResponse,
  GoogleGenerativeAIFetchError,
} from '@google/generative-ai';
import { Inject, Injectable } from '@nestjs/common';
import { GeminiModel } from '../../../../../ai/gemini/gemini-models';
import { TranslationResult } from '../../../../../types/translators';
import { keyRoundRobin } from '../../../../../utils/key-round-robin';
import { SourceLanguage } from '../../../../../utils/language';
import { sleep } from '../../../../../utils/sleep';
import { tagTexts } from '../../../../../utils/string';
import { ICacheManagerService } from '../../../../cache/cache-manager/services/i-cache-manager-service';
import { LoggerService } from '../../../../logger/logger.service';
import { ExampleManagerService } from '../../../../translation/example/services/example-manager.service';
import { GeminiPromptConverterService } from '../../prompt/services/gemini-prompt-converter.service';
import { AiTokenService } from './gemini-token.service';
import { GeminiResponseService } from './gemini-response.service';
import { AiResponseService } from '../../../common/services/ai-response-service';
import { FilePathInfo } from '@/types/cache';
import { AiTranslateParam } from '@/nest/ai/common/services/i-ai-translator-service';
import { deepClone } from '@/utils/deep-clone';
import { isNullish } from '@/utils/is-nullish';
import { RateLimiter } from 'limiter';

@Injectable()
export class GeminiTranslatorService {
  protected rateLimiterMapping: Map<string, RateLimiter> = new Map();
  private readonly MAX_ATTEMPT_COUNT = 3;
  constructor(
    @Inject(ICacheManagerService) protected readonly cacheManagerService: ICacheManagerService,
    private readonly tokenService: AiTokenService,
    @Inject(GeminiResponseService)
    private readonly geminiResponseService: AiResponseService<EnhancedGenerateContentResponse>,
    private readonly logger: LoggerService,
    protected readonly exampleManagerService: ExampleManagerService,
    private readonly promptConverterService: GeminiPromptConverterService
  ) {}

  protected async getDefaultRequestsPerMinute(modelName: GeminiModel): Promise<number> {
    switch (modelName) {
      case GeminiModel.FLASH_EXP:
        return 10;
      case GeminiModel.FLASH_THINKING_EXP:
        return 10;
      case GeminiModel.GEMINI_PRO_2_POINT_5_EXP:
        return 5;
      default:
        return 10;
    }
  }

  public async translate(
    modelName: GeminiModel,
    {
      sourceTexts,
      sourceLanguage,
      fileInfo,
      maxOutputTokenCount,
      requestsPerMinute,
      apiKey,
      promptPresetContent,
      useThinking,
    }: AiTranslateParam
  ): Promise<string[]> {
    this.setRateLimiter(modelName, requestsPerMinute);
    const apiKeyIterator = keyRoundRobin(apiKey);

    try {
      const { texts, remainingTexts } = await this.applyTranslationCache(sourceTexts);

      if (remainingTexts.size > 0) {
        const newTranslations = new Map<string, TranslationResult>();
        const currentRemainingTexts = new Map(remainingTexts);
        let consecutiveFailures = 0;
        let intermediateTexts = [...texts];

        while (currentRemainingTexts.size > 0) {
          const remainingTextArray = Array.from(currentRemainingTexts.keys());
          const batchGroups = await this.tokenService.getBatchGroups({
            texts: remainingTextArray,
            maxOutputTokenCount,
            useThinking,
          });

          for (const batchTexts of batchGroups) {
            const batchRemainingTexts = new Map<string, number[]>();

            try {
              for (const text of batchTexts) {
                const indices = currentRemainingTexts.get(text) || [];
                if (indices.length == 0) continue;
                batchRemainingTexts.set(text, indices);
                currentRemainingTexts.delete(text);
              }

              const { batchTranslations, response } = await this.translateUncachedTexts({
                remainingTexts: batchRemainingTexts,
                sourceLanguage,
                modelName,
                apiKeyIterator,
                maxOutputTokenCount,
                fileInfo,
                promptPresetContent,
              });

              // 번역 성공 시 연속 실패 횟수 초기화
              consecutiveFailures = 0;

              for (const [originalText, result] of batchTranslations.entries()) {
                newTranslations.set(originalText, result);
              }

              // 배치 번역 성공 후 중간 결과 즉시 업데이트 및 캐싱
              if (batchTranslations.size > 0) {
                intermediateTexts = await this.updateTranslationsAndCache({
                  newTranslations: new Map([...batchTranslations]),
                  translations: intermediateTexts,
                  sourceLanguage,
                  modelName,
                  fileInfo,
                });
              }

              const missingTexts = batchTexts.filter((text) => !batchTranslations.has(text));
              const successTexts = batchTexts.filter((text) => batchTranslations.has(text));
              const finishReason = response.candidates?.[0]?.finishReason;
              const finishMessage = response.candidates?.[0]?.finishMessage;
              if (missingTexts.length > 0) {
                this.logger.debug(`번역이 누락되었습니다.`, {
                  missingTexts,
                  successTexts,
                  finishReason,
                  finishMessage,
                  extra: {
                    candidates: response.candidates,
                    promptFeedback: response.promptFeedback,
                    usageMetadata: response.usageMetadata,
                  },
                });
              }

              for (const text of batchTexts) {
                if (!batchTranslations.has(text)) {
                  const indices = batchRemainingTexts.get(text) || [];
                  currentRemainingTexts.set(text, indices);
                }
              }
            } catch (error) {
              consecutiveFailures++;

              if (consecutiveFailures >= this.MAX_ATTEMPT_COUNT) {
                this.logger.error(
                  `번역이 연속으로 ${this.MAX_ATTEMPT_COUNT}회 실패하여 중단합니다.`,
                  {
                    error,
                    stack: error instanceof Error ? error.stack : undefined,
                  }
                );
                throw new Error(`번역이 연속으로 ${this.MAX_ATTEMPT_COUNT}회 실패하여 중단합니다.`);
              }

              if (error instanceof GoogleGenerativeAIFetchError) {
                this.logger.error('번역 중 api 오류 발생:', {
                  error,
                  status: error.status,
                  statusText: error.statusText,
                  errorDetails: error.errorDetails,
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

              for (const [originalText, indices] of batchRemainingTexts.entries()) {
                if (!newTranslations.has(originalText)) {
                  currentRemainingTexts.set(originalText, indices);
                }
              }
            }
          }
        }

        for (const [originalText, indices] of currentRemainingTexts.entries()) {
          newTranslations.set(originalText, { text: originalText, indices });
        }

        // 모든 번역 처리 후 최종 업데이트
        if (newTranslations.size > 0) {
          intermediateTexts = await this.updateTranslationsAndCache({
            newTranslations,
            translations: intermediateTexts,
            sourceLanguage,
            modelName,
            fileInfo,
          });
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

  protected async getModel({
    modelName,
    apiKeyIterator,
    maxOutputTokenCount,
  }: {
    modelName: GeminiModel;
    apiKeyIterator: Generator<string>;
    maxOutputTokenCount: number;
  }): Promise<GenerativeModel> {
    const apiKey = apiKeyIterator.next().value;

    return new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: modelName,
      safetySettings: [],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: maxOutputTokenCount,
        topP: 0.95,
      },
    });
  }

  protected async translateUncachedTexts({
    remainingTexts,
    sourceLanguage,
    modelName,
    apiKeyIterator,
    maxOutputTokenCount,
    fileInfo,
    promptPresetContent, // 구조 분해 할당에 추가
  }: {
    remainingTexts: Map<string, number[]>;
    sourceLanguage: SourceLanguage;
    modelName: GeminiModel;
    apiKeyIterator: Generator<string>;
    maxOutputTokenCount: number;
    fileInfo?: FilePathInfo;
    promptPresetContent?: string;
  }): Promise<{
    batchTranslations: Map<string, TranslationResult>;
    response: EnhancedGenerateContentResponse;
  }> {
    try {
      const rateLimiter = await this.getRateLimiter(modelName);
      await rateLimiter.removeTokens(1);
      const model = await this.getModel({ modelName, apiKeyIterator, maxOutputTokenCount });
      const { contents, systemInstruction } = await this.promptConverterService.getChatBlock({
        content: tagTexts(Array.from(remainingTexts.keys())),
        sourceLanguage,
        promptPresetContent,
      });

      this.logger.debug('번역 요청 전 프롬프트:', {
        contents,
        systemInstruction,
      });
      const result = await model.generateContent({
        contents,
        systemInstruction,
      });
      const response = await result.response;
      const batchTranslations = await this.geminiResponseService.parseTranslationResponse(
        response,
        remainingTexts
      );
      return {
        batchTranslations,
        response,
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
        fileInfo,
        modelName
      );

      throw error;
    }
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

  protected async applyTranslationCache(sourceTexts: string[]): Promise<{
    texts: string[];
    remainingTexts: Map<string, number[]>;
  }> {
    const texts = new Array<string>(sourceTexts.length);
    const remainingTexts = new Map<string, number[]>();
    const cachedResults = await this.cacheManagerService.getTranslations(sourceTexts);

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
    const lineRemovedText = originalText
      .replaceAll('\r', '')
      .replaceAll('\n', '')
      .replaceAll('\\n', '')
      .replaceAll('\\r', '');
    const trimmedText = lineRemovedText.trim();
    if (trimmedText === '') return { translatedText: originalText, isCacheHit: true };

    const cachedTranslation = cachedResults.get(trimmedText);
    const translatedText = isNullish(cachedTranslation) ? originalText : cachedTranslation;
    const isCacheHit = !isNullish(cachedTranslation);

    return { translatedText, isCacheHit };
  }

  protected async updateTranslationsAndCache({
    newTranslations,
    translations,
    sourceLanguage,
    modelName,
    fileInfo,
  }: {
    newTranslations: Map<string, TranslationResult>;
    translations: string[];
    sourceLanguage: SourceLanguage;
    modelName: string;
    fileInfo?: FilePathInfo;
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
    await this.cacheManagerService.setTranslations(translationsToCache, true, fileInfo, modelName);

    if (sourceLines.length > 0) {
      this.exampleManagerService.appendCurrentExample(sourceLanguage, sourceLines, resultLines);
    }

    return copiedTranslations;
  }
}
