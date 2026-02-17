import { Inject, Injectable } from '@nestjs/common';
import { keyRoundRobin } from '@/nest/ai/utils/key-round-robin';
import { ICacheManagerService } from '../../cache/cache-manager/services/i-cache-manager-service';
import { LoggerService } from '../../logger/logger.service';
import { AiPromptConverterService } from './ai-prompt-converter.service';
import { imageOcrTranslationJsonSchema } from '@/nest/ai/schema/image-ocr-translation.schema';
import { AiProxyService } from './ai-proxy.service';
import { buildLanguageScopedCacheTag } from '@apps/common/dist/utils/cache-tag';
import { AiMessage, toTextFromMessageContent } from '../dto/common-ai.dto';
import { ImageOcrTranslationResultDto } from '@/nest/translator/image/dto/response/translate-image-response.dto';
import { ImageTranslateParam, TextTranslateParam, TranslateParam } from './translator.types';
import { TextBatchTranslationService } from './text-batch-translation.service';
import { AiRateLimiterService } from './ai-rate-limiter.service';

@Injectable()
export class UnifiedAiTranslatorService {
  constructor(
    @Inject(ICacheManagerService)
    private readonly cacheManagerService: ICacheManagerService,
    private readonly logger: LoggerService,
    private readonly promptConverterService: AiPromptConverterService,
    private readonly aiProxy: AiProxyService,
    private readonly textBatchTranslationService: TextBatchTranslationService,
    private readonly rateLimiterService: AiRateLimiterService
  ) {}

  public async translate(param: TextTranslateParam): Promise<string[]>;
  public async translate(param: ImageTranslateParam): Promise<ImageOcrTranslationResultDto>;
  public async translate(param: TranslateParam): Promise<string[] | ImageOcrTranslationResultDto> {
    if ('sourceTexts' in param) {
      const result = await this.textBatchTranslationService.translateText(param);
      return result.texts;
    }

    const imageParam = param as ImageTranslateParam;
    if (!imageParam.fileName && !imageParam.imageData) {
      throw new Error('Either file path or image data is required for image translation.');
    }

    return this.translateImage(imageParam);
  }

  public async getEstimatedTokenCount(texts: string[] | string): Promise<number> {
    return this.textBatchTranslationService.getEstimatedTokenCount(texts);
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
    await this.rateLimiterService.setRateLimiter(modelName, requestsPerMinute);

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
      content: 'dataUrl',
      sourceLanguage: aiSettings.sourceLanguage,
      targetLanguage: aiSettings.targetLanguage,
      promptPresetContent,
      imageDataUrl: dataUrl,
    });

    const iter = keyRoundRobin(aiSettings.apiKey);
    if (!iter) throw new Error('API key is required for image translation');
    const firstKey = iter.next();
    const apiKey = !firstKey.done ? (firstKey.value as string) : undefined;
    if (!apiKey) throw new Error('API key is required for image translation');

    const rateLimiter = await this.rateLimiterService.getRateLimiter(modelName);
    await rateLimiter.removeTokens(1);

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
