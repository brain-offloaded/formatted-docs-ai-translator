import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { TranslationResult } from '../../../types/translators';
import { keyRoundRobin } from '../../../utils/key-round-robin';
import { SourceLanguage } from '../../../utils/language';
import { sleep } from '../../../utils/sleep';
import { tagTexts } from '../../../utils/string';
import { ICacheManagerService } from '../../cache/cache-manager/services/i-cache-manager-service';
import { LoggerService } from '../../logger/logger.service';
import { ExampleManagerService } from '../../translation/example/services/example-manager.service';
import { AiTokenService } from './ai-token.service';
import { AiResponseService } from './ai-response.service';
import { FilePathInfo } from '@/types/cache';
import { deepClone } from '@/utils/deep-clone';
import { isNullish } from '@/utils/is-nullish';
import { RateLimiter } from 'limiter';
import { AiPromptConverterService } from './ai-prompt-converter.service';
import { ModelProvider, getProviderUrl } from '@/ai/provider';

export interface AiTranslateParam {
  modelProvider: ModelProvider;
  customUrl?: string;
  modelName: string;
  sourceTexts: string[];
  sourceLanguage: SourceLanguage;
  fileInfo?: FilePathInfo;
  maxOutputTokenCount: number;
  requestsPerMinute: number;
  apiKey: string;
  promptPresetContent: string;
  useThinking: boolean;
}

@Injectable()
export class UnifiedAiTranslatorService {
  protected rateLimiterMapping: Map<string, RateLimiter> = new Map();
  private readonly MAX_ATTEMPT_COUNT = 3;
  constructor(
    @Inject(ICacheManagerService) protected readonly cacheManagerService: ICacheManagerService,
    private readonly tokenService: AiTokenService,
    @Inject(AiResponseService)
    private readonly geminiResponseService: AiResponseService,
    private readonly logger: LoggerService,
    protected readonly exampleManagerService: ExampleManagerService,
    private readonly promptConverterService: AiPromptConverterService
  ) {}

  public async translate(param: AiTranslateParam): Promise<string[]> {
    const {
      modelProvider,
      customUrl,
      modelName,
      sourceTexts,
      sourceLanguage,
      fileInfo,
      maxOutputTokenCount,
      requestsPerMinute,
      apiKey,
      promptPresetContent,
      useThinking,
    } = param;
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
                modelProvider,
                customUrl,
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
              const finishReason = response.choices?.[0]?.finish_reason;
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

              if (error instanceof OpenAI.APIError) {
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

  protected async getClient({
    baseURL,
    apiKeyIterator,
  }: {
    baseURL: string;
    apiKeyIterator: Generator<string>;
  }): Promise<OpenAI> {
    const apiKey = apiKeyIterator.next().value;

    return new OpenAI({
      apiKey,
      baseURL,
    });
  }

  protected async translateUncachedTexts({
    remainingTexts,
    sourceLanguage,
    modelName,
    apiKeyIterator,
    maxOutputTokenCount,
    fileInfo,
    promptPresetContent,
    modelProvider,
    customUrl,
  }: {
    remainingTexts: Map<string, number[]>;
    sourceLanguage: SourceLanguage;
    modelName: string;
    apiKeyIterator: Generator<string>;
    maxOutputTokenCount: number;
    fileInfo?: FilePathInfo;
    promptPresetContent?: string;
    modelProvider: ModelProvider;
    customUrl?: string;
  }): Promise<{
    batchTranslations: Map<string, TranslationResult>;
    response: OpenAI.Chat.Completions.ChatCompletion;
  }> {
    try {
      const rateLimiter = await this.getRateLimiter(modelName);
      await rateLimiter.removeTokens(1);
      const baseURL = getProviderUrl(modelProvider, customUrl);
      const openai = await this.getClient({ apiKeyIterator, baseURL });
      const { contents, systemInstruction } = await this.promptConverterService.getChatBlock({
        content: tagTexts(Array.from(remainingTexts.keys())),
        sourceLanguage,
        promptPresetContent,
      });

      this.logger.debug('번역 요청 전 프롬프트:', {
        contents,
        systemInstruction,
      });

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (systemInstruction) {
        messages.push({
          role: 'system',
          content: systemInstruction,
        });
      }
      for (const content of contents) {
        if (content.role === 'USER') {
          messages.push({
            role: 'user',
            content: content.parts,
          });
        } else {
          messages.push({
            role: 'assistant',
            content: content.parts
              .filter((p) => p.type === 'text')
              .map((p) => (p as OpenAI.Chat.Completions.ChatCompletionContentPartText).text)
              .join(''),
          });
        }
      }

      const response = await openai.chat.completions.create({
        model: modelName,
        messages,
        temperature: 0.5,
        max_tokens: maxOutputTokenCount,
        top_p: 0.95,
      });

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
