import { EnhancedGenerateContentResponse } from '@google/generative-ai';
import { RateLimiter } from 'limiter';
import { AiModelName, getDefaultRequestsPerMinuteByModel } from '../../../../ai/model';
import { TranslationResult } from '../../../../types/translators';
import { deepClone } from '../../../../utils/deep-clone';
import { SourceLanguage } from '../../../../utils/language';
import { ICacheManagerService } from '../../../cache/cache-manager/services/i-cache-manager-service';
import { ExampleManagerService } from '../../../translation/example/services/example-manager.service';
import { IAiTranslatorService } from './i-ai-translator-service';
import { isNullish } from '../../../../utils/is-nullish';
import { FilePathInfo } from '@/types/cache';

export abstract class AiTranslatorService<ModelName extends AiModelName, AiModelRequester>
  implements IAiTranslatorService<ModelName>
{
  protected rateLimiterMapping: Map<ModelName, RateLimiter> = new Map();
  protected readonly cacheManagerService: ICacheManagerService;
  protected readonly exampleManagerService: ExampleManagerService;

  protected async setRateLimiter(modelName: ModelName, requestsPerMinute?: number): Promise<void> {
    if (this.rateLimiterMapping.has(modelName)) return;

    this.rateLimiterMapping.set(
      modelName,
      new RateLimiter({
        tokensPerInterval: getDefaultRequestsPerMinuteByModel(modelName, requestsPerMinute),
        interval: 'minute',
      })
    );
  }

  protected async getRateLimiter(modelName: ModelName): Promise<RateLimiter> {
    if (!this.rateLimiterMapping.has(modelName)) await this.setRateLimiter(modelName);

    return this.rateLimiterMapping.get(modelName)!;
  }

  public abstract translate(
    modelName: ModelName,
    param: {
      sourceTexts: string[];
      sourceLanguage: SourceLanguage;
      fileInfo?: FilePathInfo;
      maxOutputTokenCount?: number;
      requestsPerMinute?: number;
      apiKey: string;
    }
  ): Promise<string[]>;

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
    modelName: ModelName;
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

  protected abstract getModel(param: {
    modelName: ModelName;
    apiKeyIterator: Generator<string>;
    maxOutputTokenCount?: number;
  }): Promise<AiModelRequester>;

  protected abstract translateUncachedTexts(param: {
    remainingTexts: Map<string, number[]>;
    sourceLanguage: SourceLanguage;
    modelName: ModelName;
    apiKeyIterator: Generator<string>;
    maxOutputTokenCount?: number;
    fileInfo?: FilePathInfo;
  }): Promise<{
    batchTranslations: Map<string, TranslationResult>;
    response: EnhancedGenerateContentResponse;
  }>;

  public abstract getEstimatedTokenCount(texts: string[] | string): Promise<number>;
}
