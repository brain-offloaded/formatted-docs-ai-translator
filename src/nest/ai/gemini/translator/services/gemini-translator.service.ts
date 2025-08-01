import {
  GenerativeModel,
  GoogleGenerativeAI,
  EnhancedGenerateContentResponse,
  GoogleGenerativeAIFetchError,
} from '@google/generative-ai';
import { Inject, Injectable } from '@nestjs/common';

import { GeminiModel } from '../../../../../ai/gemini/gemini-models';
import { getDefaultMaxOutputTokenCountByModel } from '../../../../../ai/model';
import { TranslationResult } from '../../../../../types/translators';
import { keyRoundRobin } from '../../../../../utils/key-round-robin';
import { SourceLanguage } from '../../../../../utils/language';
import { sleep } from '../../../../../utils/sleep';
import { tagTexts } from '../../../../../utils/string';
import { AiTranslatorService } from '../../../common/services/ai-translator-service';
import { AiTokenService } from '../../../common/services/ai-token-service';
import { ICacheManagerService } from '../../../../cache/cache-manager/services/i-cache-manager-service';
import { LoggerService } from '../../../../logger/logger.service';
import { ExampleManagerService } from '../../../../translation/example/services/example-manager.service';
import { GeminiPromptConverterService } from '../../prompt/services/gemini-prompt-converter.service';
import { GeminiTokenService } from './gemini-token.service';
import { GeminiResponseService } from './gemini-response.service';
import { AiResponseService } from '../../../common/services/ai-response-service';
import { FilePathInfo } from '@/types/cache';
import { AiTranslateParam } from '@/nest/ai/common/services/i-ai-translator-service';

@Injectable()
export class GeminiTranslatorService extends AiTranslatorService<GeminiModel, GenerativeModel> {
  private readonly MAX_ATTEMPT_COUNT = 3;
  constructor(
    @Inject(ICacheManagerService) protected readonly cacheManagerService: ICacheManagerService,
    @Inject(GeminiTokenService) private readonly tokenService: AiTokenService<GeminiModel>,
    @Inject(GeminiResponseService)
    private readonly geminiResponseService: AiResponseService<EnhancedGenerateContentResponse>,
    private readonly logger: LoggerService,
    protected readonly exampleManagerService: ExampleManagerService,
    private readonly promptConverterService: GeminiPromptConverterService
  ) {
    super();
  }

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
      thinkingMode,
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
            maxOutputTokenCount: maxOutputTokenCount,
            modelName,
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
                thinkingMode,
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
    maxOutputTokenCount?: number;
  }): Promise<GenerativeModel> {
    const apiKey = apiKeyIterator.next().value;

    const maxOutputTokens = getDefaultMaxOutputTokenCountByModel(modelName, maxOutputTokenCount);

    return new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: modelName,
      safetySettings: [],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens,
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
    thinkingMode,
  }: {
    remainingTexts: Map<string, number[]>;
    sourceLanguage: SourceLanguage;
    modelName: GeminiModel;
    apiKeyIterator: Generator<string>;
    maxOutputTokenCount?: number;
    fileInfo?: FilePathInfo;
    promptPresetContent?: string;
    thinkingMode?: boolean;
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
        thinkingMode,
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
}
