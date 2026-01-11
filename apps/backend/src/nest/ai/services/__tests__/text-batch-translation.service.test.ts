import { TextBatchTranslationService } from '../text-batch-translation.service';
import { SourceLanguage, TargetLanguage } from '@apps/common/dist/language';
import {
  ModelProvider,
  TranslatorAiSettings,
} from '@/nest/translator/common/dto/translator-settings.dto';
import type { ICacheManagerService } from '@/nest/cache/cache-manager/services/i-cache-manager-service';
import type { AiTokenService } from '../ai-token.service';
import type { LoggerService } from '@/nest/logger/logger.service';
import type { ExampleManagerService } from '@/nest/translation/example/services/example-manager.service';
import type { AiPromptConverterService } from '../ai-prompt-converter.service';
import type { AiProxyService } from '../ai-proxy.service';
import type { AiRateLimiterService } from '../ai-rate-limiter.service';
import type { TranslationResult } from '@/nest/ai/types/translation-result.interface';
import type { AiChatResponse } from '@/nest/ai/dto/common-ai.dto';

const buildAiSettings = (): TranslatorAiSettings => ({
  modelProvider: ModelProvider.OPENAI_COMPATIBLE,
  sourceLanguage: SourceLanguage.ENGLISH,
  targetLanguage: TargetLanguage.KOREAN,
  apiKey: 'test-key',
  baseUrl: 'http://localhost',
  customModelConfig: {
    modelName: 'test-model',
    requestsPerMinute: 60,
    maxOutputTokenCount: 1024,
    maxConcurrentRequests: 1,
  },
  useThinking: false,
  thinkingLevel: '',
  thinkingBudget: 0,
  setThinkingBudget: false,
});

const buildResponse = (): AiChatResponse => ({
  choices: [
    {
      message: {
        role: 'assistant',
        content: '',
      },
    },
  ],
});

const createService = () => {
  const cacheManagerService = {
    getTranslations: jest.fn(),
    setTranslations: jest.fn(),
  } satisfies Pick<ICacheManagerService, 'getTranslations' | 'setTranslations'>;

  const tokenService = {
    getBatchGroups: jest.fn(),
  } satisfies Pick<AiTokenService, 'getBatchGroups'>;

  const logger = {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } satisfies Pick<LoggerService, 'debug' | 'warn' | 'error'>;

  const exampleManagerService = {
    appendCurrentExample: jest.fn(),
  } satisfies Pick<ExampleManagerService, 'appendCurrentExample'>;

  const promptConverterService = {} as AiPromptConverterService;
  const aiProxy = {} as AiProxyService;

  const rateLimiterService = {
    setRateLimiter: jest.fn(),
  } satisfies Pick<AiRateLimiterService, 'setRateLimiter'>;

  const service = new TextBatchTranslationService(
    cacheManagerService as unknown as ICacheManagerService,
    tokenService as unknown as AiTokenService,
    logger as unknown as LoggerService,
    exampleManagerService as unknown as ExampleManagerService,
    promptConverterService as unknown as AiPromptConverterService,
    aiProxy as unknown as AiProxyService,
    rateLimiterService as unknown as AiRateLimiterService
  );

  return {
    service,
    cacheManagerService,
    tokenService,
    exampleManagerService,
  };
};

describe('TextBatchTranslationService 줄바꿈 재시도', () => {
  it('줄바꿈 불일치가 반복되면 원문을 유지한다', async () => {
    const sourceText = '첫 줄\n둘째 줄';
    const { service, cacheManagerService, tokenService, exampleManagerService } = createService();

    cacheManagerService.getTranslations.mockResolvedValue(new Map([[sourceText, null]]));
    tokenService.getBatchGroups.mockResolvedValue([[sourceText]]);

    const translateUncachedTexts = jest.fn().mockResolvedValue({
      batchTranslations: new Map<string, TranslationResult>(),
      response: buildResponse(),
      shouldReduceBatchSize: false,
      hasPartialData: false,
      lineBreakMismatchTexts: new Set([sourceText]),
    });
    (
      service as unknown as {
        translateUncachedTexts: typeof translateUncachedTexts;
      }
    ).translateUncachedTexts = translateUncachedTexts;

    const result = await service.translateText({
      requestId: 'req-linebreak',
      sourceTexts: [sourceText],
      promptPresetContent: '',
      aiSettings: buildAiSettings(),
      cacheTag: 'default',
    });

    expect(result).toEqual([sourceText]);
    expect(translateUncachedTexts).toHaveBeenCalledTimes(3);
    expect(cacheManagerService.setTranslations).not.toHaveBeenCalled();
    expect(exampleManagerService.appendCurrentExample).not.toHaveBeenCalled();
  });

  it('줄바꿈 불일치 후 정상 번역되면 번역 결과를 반환한다', async () => {
    const sourceText = 'hello\nworld';
    const translatedText = '안녕하세요\n세계';
    const { service, cacheManagerService, tokenService, exampleManagerService } = createService();

    cacheManagerService.getTranslations.mockResolvedValue(new Map([[sourceText, null]]));
    tokenService.getBatchGroups.mockResolvedValue([[sourceText]]);

    const translateUncachedTexts = jest
      .fn()
      .mockResolvedValueOnce({
        batchTranslations: new Map<string, TranslationResult>(),
        response: buildResponse(),
        shouldReduceBatchSize: false,
        hasPartialData: false,
        lineBreakMismatchTexts: new Set([sourceText]),
      })
      .mockResolvedValueOnce({
        batchTranslations: new Map<string, TranslationResult>([
          [sourceText, { text: translatedText, indices: [0] }],
        ]),
        response: buildResponse(),
        shouldReduceBatchSize: false,
        hasPartialData: false,
        lineBreakMismatchTexts: new Set<string>(),
      });
    (
      service as unknown as {
        translateUncachedTexts: typeof translateUncachedTexts;
      }
    ).translateUncachedTexts = translateUncachedTexts;

    const result = await service.translateText({
      requestId: 'req-linebreak-success',
      sourceTexts: [sourceText],
      promptPresetContent: '',
      aiSettings: buildAiSettings(),
      cacheTag: 'default',
    });

    expect(result).toEqual([translatedText]);
    expect(translateUncachedTexts).toHaveBeenCalledTimes(2);
    expect(cacheManagerService.setTranslations).toHaveBeenCalledTimes(1);
    expect(exampleManagerService.appendCurrentExample).toHaveBeenCalledTimes(1);
  });

  it('캐시 줄바꿈 불일치가 있으면 재번역한다', async () => {
    const sourceText = 'A\nB';
    const cachedTranslation = 'A\r\nB';
    const translatedText = 'A\nB-tr';
    const { service, cacheManagerService, tokenService } = createService();

    cacheManagerService.getTranslations.mockResolvedValue(
      new Map<string, string | null>([[sourceText, cachedTranslation]])
    );
    tokenService.getBatchGroups.mockResolvedValue([[sourceText]]);

    const translateUncachedTexts = jest.fn().mockResolvedValue({
      batchTranslations: new Map<string, TranslationResult>([
        [sourceText, { text: translatedText, indices: [0] }],
      ]),
      response: buildResponse(),
      shouldReduceBatchSize: false,
      hasPartialData: false,
      lineBreakMismatchTexts: new Set<string>(),
    });
    (
      service as unknown as {
        translateUncachedTexts: typeof translateUncachedTexts;
      }
    ).translateUncachedTexts = translateUncachedTexts;

    const result = await service.translateText({
      requestId: 'req-cache-mismatch',
      sourceTexts: [sourceText],
      promptPresetContent: '',
      aiSettings: buildAiSettings(),
      cacheTag: 'default',
    });

    expect(translateUncachedTexts).toHaveBeenCalledTimes(1);
    expect(result).toEqual([translatedText]);
  });
});
