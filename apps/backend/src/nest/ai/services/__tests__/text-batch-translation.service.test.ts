import { TextBatchTranslationService } from '../text-batch-translation.service';
import { SourceLanguage, TargetLanguage } from '@apps/common/dist/language';
import { buildLanguageScopedCacheTag } from '@apps/common/dist/utils/cache-tag';
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
    setTranslation: jest.fn(),
    setTranslations: jest.fn(),
  } satisfies Pick<ICacheManagerService, 'getTranslations' | 'setTranslation' | 'setTranslations'>;

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
    logger,
  };
};

describe('TextBatchTranslationService 검증 불일치 재시도', () => {
  it('transtranstrans 플레이스홀더 불일치는 실패 캐시로 남긴다', async () => {
    const sourceText = 'transtranstrans';
    const { service, cacheManagerService, tokenService, exampleManagerService } = createService();

    cacheManagerService.getTranslations.mockResolvedValue(new Map([[sourceText, null]]));
    tokenService.getBatchGroups.mockResolvedValue([[sourceText]]);

    const translateUncachedTexts = jest.fn().mockResolvedValue({
      batchTranslations: new Map<string, TranslationResult>(),
      response: buildResponse(),
      shouldReduceBatchSize: false,
      hasPartialData: false,
      validationMismatchTexts: new Set([sourceText]),
      validationMismatchTranslations: new Map([[sourceText, '번역번역번역']]),
    });
    (
      service as unknown as {
        translateUncachedTexts: typeof translateUncachedTexts;
      }
    ).translateUncachedTexts = translateUncachedTexts;

    const result = await service.translateText({
      requestId: 'req-transtranstrans',
      sourceTexts: [sourceText],
      promptPresetContent: '',
      aiSettings: buildAiSettings(),
      cacheTag: 'default',
      placeholderPreservation: {
        enabled: true,
        rules: [{ pattern: 'transtranstrans', flags: '' }],
      },
    });

    expect(result.texts).toEqual([sourceText]);
    expect(result.strictMetaByIndex).toEqual([
      {
        strictFailed: true,
        strictFailureReasons: ['placeholder_mismatch'],
        strictFailureCount: 1,
      },
    ]);
    expect(translateUncachedTexts).toHaveBeenCalledTimes(3);
    expect(cacheManagerService.setTranslations).toHaveBeenCalledTimes(3);
    expect(cacheManagerService.setTranslations).toHaveBeenNthCalledWith(
      1,
      new Map([[sourceText, '번역번역번역']]),
      false,
      'test-model',
      buildLanguageScopedCacheTag('default', SourceLanguage.ENGLISH, TargetLanguage.KOREAN),
      'placeholder_mismatch'
    );
    expect(exampleManagerService.appendCurrentExample).not.toHaveBeenCalled();
  });

  it('검증 불일치가 반복되면 원문을 유지한다', async () => {
    const sourceText = '첫 줄\n둘째 줄';
    const { service, cacheManagerService, tokenService, exampleManagerService } = createService();

    cacheManagerService.getTranslations.mockResolvedValue(new Map([[sourceText, null]]));
    tokenService.getBatchGroups.mockResolvedValue([[sourceText]]);

    const translateUncachedTexts = jest.fn().mockResolvedValue({
      batchTranslations: new Map<string, TranslationResult>(),
      response: buildResponse(),
      shouldReduceBatchSize: false,
      hasPartialData: false,
      validationMismatchTexts: new Set([sourceText]),
      validationMismatchTranslations: new Map([[sourceText, '첫 줄 둘째 줄']]),
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

    expect(result.texts).toEqual([sourceText]);
    expect(result.strictMetaByIndex).toEqual([
      {
        strictFailed: true,
        strictFailureReasons: ['placeholder_mismatch'],
        strictFailureCount: 1,
      },
    ]);
    expect(translateUncachedTexts).toHaveBeenCalledTimes(3);
    expect(cacheManagerService.setTranslations).toHaveBeenCalledTimes(3);
    expect(cacheManagerService.setTranslations).toHaveBeenNthCalledWith(
      1,
      new Map([[sourceText, '첫 줄 둘째 줄']]),
      false,
      'test-model',
      buildLanguageScopedCacheTag('default', SourceLanguage.ENGLISH, TargetLanguage.KOREAN),
      'placeholder_mismatch'
    );
    expect(exampleManagerService.appendCurrentExample).not.toHaveBeenCalled();
  });

  it('검증 불일치 후 정상 번역되면 번역 결과를 반환한다', async () => {
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
        validationMismatchTexts: new Set([sourceText]),
        validationMismatchTranslations: new Map([[sourceText, '안녕하세요 세계']]),
      })
      .mockResolvedValueOnce({
        batchTranslations: new Map<string, TranslationResult>([
          [sourceText, { text: translatedText, indices: [0] }],
        ]),
        response: buildResponse(),
        shouldReduceBatchSize: false,
        hasPartialData: false,
        validationMismatchTexts: new Set<string>(),
        validationMismatchTranslations: new Map<string, string>(),
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

    expect(result.texts).toEqual([translatedText]);
    expect(result.strictMetaByIndex).toEqual([
      {
        strictFailed: false,
        strictFailureReasons: [],
        strictFailureCount: 0,
      },
    ]);
    expect(translateUncachedTexts).toHaveBeenCalledTimes(2);
    expect(cacheManagerService.setTranslations).toHaveBeenCalledTimes(2);
    expect(cacheManagerService.setTranslations).toHaveBeenNthCalledWith(
      1,
      new Map([[sourceText, '안녕하세요 세계']]),
      false,
      'test-model',
      buildLanguageScopedCacheTag('default', SourceLanguage.ENGLISH, TargetLanguage.KOREAN),
      'placeholder_mismatch'
    );
    expect(cacheManagerService.setTranslations).toHaveBeenNthCalledWith(
      2,
      new Map([[sourceText, translatedText]]),
      true,
      'test-model',
      buildLanguageScopedCacheTag('default', SourceLanguage.ENGLISH, TargetLanguage.KOREAN)
    );
    expect(exampleManagerService.appendCurrentExample).toHaveBeenCalledTimes(1);
  });

  it('캐시 검증 불일치가 있으면 재번역한다', async () => {
    const sourceText = 'A\nB';
    const cachedTranslation = 'A\r\nB';
    const translatedText = 'A\nB-tr';
    const { service, cacheManagerService, tokenService, exampleManagerService } = createService();

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
      validationMismatchTexts: new Set<string>(),
      validationMismatchTranslations: new Map<string, string>(),
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
      placeholderPreservation: {
        enabled: true,
        rules: [
          { pattern: '\\r', flags: '' },
          { pattern: '\\n', flags: '' },
        ],
      },
    });

    expect(translateUncachedTexts).toHaveBeenCalledTimes(1);
    expect(result.texts).toEqual([translatedText]);
    expect(result.strictMetaByIndex).toEqual([
      {
        strictFailed: false,
        strictFailureReasons: [],
        strictFailureCount: 0,
      },
    ]);
    expect(exampleManagerService.appendCurrentExample).toHaveBeenCalledTimes(1);
    expect(exampleManagerService.appendCurrentExample).toHaveBeenCalledWith(
      'req-cache-mismatch',
      SourceLanguage.ENGLISH,
      TargetLanguage.KOREAN,
      [sourceText],
      [translatedText]
    );
  });

  it('캐시 플레이스홀더 보존 불일치가 있으면 재번역한다', async () => {
    const sourceText = 'Hello {1}\nWorld';
    const cachedTranslation = '안녕\n세계'; // {1} 누락
    const translatedText = '안녕 {1}\n세계';
    const { service, cacheManagerService, tokenService, logger } = createService();

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
      validationMismatchTexts: new Set<string>(),
      validationMismatchTranslations: new Map<string, string>(),
    });
    (
      service as unknown as {
        translateUncachedTexts: typeof translateUncachedTexts;
      }
    ).translateUncachedTexts = translateUncachedTexts;

    const result = await service.translateText({
      requestId: 'req-cache-placeholder-mismatch',
      sourceTexts: [sourceText],
      promptPresetContent: '',
      aiSettings: buildAiSettings(),
      cacheTag: 'default',
      placeholderPreservation: {
        enabled: true,
        rules: [{ pattern: '\\{\\d+\\}', flags: '' }],
      },
    });

    const cacheCheck = (
      service as unknown as {
        getTranslationFromCachedResult: (
          originalText: string,
          cachedResults: Map<string, string | null>,
          placeholderPreservation?: {
            enabled: boolean;
            rules: Array<{ pattern: string; flags?: string; enabled?: boolean }>;
          }
        ) => { translatedText: string; isCacheHit: boolean };
      }
    ).getTranslationFromCachedResult(sourceText, new Map([[sourceText, cachedTranslation]]), {
      enabled: true,
      rules: [{ pattern: '\\{\\d+\\}', flags: '' }],
    });
    expect(cacheCheck.isCacheHit).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      '캐시 번역 플레이스홀더 보존 불일치로 재번역합니다.',
      expect.objectContaining({
        originalText: sourceText,
        cachedTranslation,
        placeholderMismatch: expect.objectContaining({
          reason: 'multiset_mismatch',
          missingPlaceholders: expect.arrayContaining([
            expect.objectContaining({
              value: '{1}',
              expectedCount: 1,
              actualCount: 0,
            }),
          ]),
        }),
      })
    );
    expect(result.texts).toEqual([translatedText]);
    expect(result.strictMetaByIndex).toEqual([
      {
        strictFailed: false,
        strictFailureReasons: [],
        strictFailureCount: 0,
      },
    ]);
  });

  it('캐시 플레이스홀더 규칙이 비활성화면 캐시를 재사용한다', async () => {
    const sourceText = 'Hello {1}\nWorld';
    const cachedTranslation = '안녕\n세계'; // {1} 누락
    const { service, cacheManagerService, tokenService, exampleManagerService } = createService();

    cacheManagerService.getTranslations.mockResolvedValue(
      new Map<string, string | null>([[sourceText, cachedTranslation]])
    );
    tokenService.getBatchGroups.mockResolvedValue([[sourceText]]);

    const translateUncachedTexts = jest.fn();
    (
      service as unknown as {
        translateUncachedTexts: typeof translateUncachedTexts;
      }
    ).translateUncachedTexts = translateUncachedTexts;

    const result = await service.translateText({
      requestId: 'req-cache-placeholder-disabled',
      sourceTexts: [sourceText],
      promptPresetContent: '',
      aiSettings: buildAiSettings(),
      cacheTag: 'default',
      placeholderPreservation: {
        enabled: true,
        rules: [{ pattern: '\\{\\d+\\}', flags: '', enabled: false }],
      },
    });

    const cacheCheck = (
      service as unknown as {
        getTranslationFromCachedResult: (
          originalText: string,
          cachedResults: Map<string, string | null>,
          placeholderPreservation?: {
            enabled: boolean;
            rules: Array<{ pattern: string; flags?: string; enabled?: boolean }>;
          }
        ) => { translatedText: string; isCacheHit: boolean };
      }
    ).getTranslationFromCachedResult(sourceText, new Map([[sourceText, cachedTranslation]]), {
      enabled: true,
      rules: [{ pattern: '\\{\\d+\\}', flags: '', enabled: false }],
    });

    expect(cacheCheck.isCacheHit).toBe(true);
    expect(translateUncachedTexts).not.toHaveBeenCalled();
    expect(result.texts).toEqual([cachedTranslation]);
    expect(result.strictMetaByIndex).toEqual([
      {
        strictFailed: false,
        strictFailureReasons: [],
        strictFailureCount: 0,
      },
    ]);
    expect(exampleManagerService.appendCurrentExample).toHaveBeenCalledTimes(1);
    expect(exampleManagerService.appendCurrentExample).toHaveBeenCalledWith(
      'req-cache-placeholder-disabled',
      SourceLanguage.ENGLISH,
      TargetLanguage.KOREAN,
      [sourceText],
      [cachedTranslation]
    );
  });

  it('캐시 플레이스홀더 매칭 문자열이 바뀌면 재번역한다', async () => {
    const sourceText = 'Hello {A} love {B}';
    const cachedTranslation = '{A} love {C}'; // {B} -> {C}
    const translatedText = '{A} love {B}';
    const { service, cacheManagerService, tokenService, exampleManagerService } = createService();

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
      validationMismatchTexts: new Set<string>(),
      validationMismatchTranslations: new Map<string, string>(),
    });
    (
      service as unknown as {
        translateUncachedTexts: typeof translateUncachedTexts;
      }
    ).translateUncachedTexts = translateUncachedTexts;

    const result = await service.translateText({
      requestId: 'req-cache-placeholder-value-mismatch',
      sourceTexts: [sourceText],
      promptPresetContent: '',
      aiSettings: buildAiSettings(),
      cacheTag: 'default',
      placeholderPreservation: {
        enabled: true,
        rules: [{ pattern: '\\{.+?\\}', flags: '' }],
      },
    });

    const cacheCheck = (
      service as unknown as {
        getTranslationFromCachedResult: (
          originalText: string,
          cachedResults: Map<string, string | null>,
          placeholderPreservation?: {
            enabled: boolean;
            rules: Array<{ pattern: string; flags?: string; enabled?: boolean }>;
          }
        ) => { translatedText: string; isCacheHit: boolean };
      }
    ).getTranslationFromCachedResult(sourceText, new Map([[sourceText, cachedTranslation]]), {
      enabled: true,
      rules: [{ pattern: '\\{.+?\\}', flags: '' }],
    });

    expect(cacheCheck.isCacheHit).toBe(false);
    expect(result.texts).toEqual([translatedText]);
    expect(result.strictMetaByIndex).toEqual([
      {
        strictFailed: false,
        strictFailureReasons: [],
        strictFailureCount: 0,
      },
    ]);
    expect(exampleManagerService.appendCurrentExample).toHaveBeenCalledTimes(1);
    expect(exampleManagerService.appendCurrentExample).toHaveBeenCalledWith(
      'req-cache-placeholder-value-mismatch',
      SourceLanguage.ENGLISH,
      TargetLanguage.KOREAN,
      [sourceText],
      [translatedText]
    );
  });

  it('검증을 통과한 캐시 히트는 배치보다 앞선 순서대로 example manager에 먼저 누적한다', async () => {
    const cachedSource = 'a';
    const cachedTranslation = 'A';
    const uncachedSource = 'b';
    const uncachedTranslation = 'B';
    const { service, cacheManagerService, tokenService, exampleManagerService } = createService();

    cacheManagerService.getTranslations.mockResolvedValue(
      new Map<string, string | null>([
        [cachedSource, cachedTranslation],
        [uncachedSource, null],
      ])
    );
    tokenService.getBatchGroups.mockResolvedValue([[uncachedSource]]);

    const translateUncachedTexts = jest.fn().mockResolvedValue({
      batchTranslations: new Map<string, TranslationResult>([
        [uncachedSource, { text: uncachedTranslation, indices: [1] }],
      ]),
      response: buildResponse(),
      shouldReduceBatchSize: false,
      hasPartialData: false,
      validationMismatchTexts: new Set<string>(),
      validationMismatchTranslations: new Map<string, string>(),
    });
    (
      service as unknown as {
        translateUncachedTexts: typeof translateUncachedTexts;
      }
    ).translateUncachedTexts = translateUncachedTexts;

    const result = await service.translateText({
      requestId: 'req-cache-hit-before-batch',
      sourceTexts: [cachedSource, uncachedSource],
      promptPresetContent: '',
      aiSettings: buildAiSettings(),
      cacheTag: 'default',
    });

    expect(result.texts).toEqual([cachedTranslation, uncachedTranslation]);
    expect(exampleManagerService.appendCurrentExample).toHaveBeenCalledTimes(2);
    expect(exampleManagerService.appendCurrentExample).toHaveBeenNthCalledWith(
      1,
      'req-cache-hit-before-batch',
      SourceLanguage.ENGLISH,
      TargetLanguage.KOREAN,
      [cachedSource],
      [cachedTranslation]
    );
    expect(exampleManagerService.appendCurrentExample).toHaveBeenNthCalledWith(
      2,
      'req-cache-hit-before-batch',
      SourceLanguage.ENGLISH,
      TargetLanguage.KOREAN,
      [uncachedSource],
      [uncachedTranslation]
    );
    expect(exampleManagerService.appendCurrentExample.mock.invocationCallOrder[0]).toBeLessThan(
      translateUncachedTexts.mock.invocationCallOrder[0]
    );
  });

  it('뒤쪽 캐시 히트도 입력 순서대로 example manager에 누적한다', async () => {
    const uncachedSource = 'b';
    const uncachedTranslation = 'B';
    const trailingCachedSource = 'c';
    const trailingCachedTranslation = 'C';
    const { service, cacheManagerService, tokenService, exampleManagerService } = createService();

    cacheManagerService.getTranslations.mockResolvedValue(
      new Map<string, string | null>([
        [uncachedSource, null],
        [trailingCachedSource, trailingCachedTranslation],
      ])
    );
    tokenService.getBatchGroups.mockResolvedValue([[uncachedSource]]);

    const translateUncachedTexts = jest.fn().mockResolvedValue({
      batchTranslations: new Map<string, TranslationResult>([
        [uncachedSource, { text: uncachedTranslation, indices: [0] }],
      ]),
      response: buildResponse(),
      shouldReduceBatchSize: false,
      hasPartialData: false,
      validationMismatchTexts: new Set<string>(),
      validationMismatchTranslations: new Map<string, string>(),
    });
    (
      service as unknown as {
        translateUncachedTexts: typeof translateUncachedTexts;
      }
    ).translateUncachedTexts = translateUncachedTexts;

    const result = await service.translateText({
      requestId: 'req-trailing-cache-hit',
      sourceTexts: [uncachedSource, trailingCachedSource],
      promptPresetContent: '',
      aiSettings: buildAiSettings(),
      cacheTag: 'default',
    });

    expect(result.texts).toEqual([uncachedTranslation, trailingCachedTranslation]);
    expect(exampleManagerService.appendCurrentExample).toHaveBeenCalledTimes(1);
    expect(exampleManagerService.appendCurrentExample).toHaveBeenNthCalledWith(
      1,
      'req-trailing-cache-hit',
      SourceLanguage.ENGLISH,
      TargetLanguage.KOREAN,
      [uncachedSource, trailingCachedSource],
      [uncachedTranslation, trailingCachedTranslation]
    );
  });

  it('같은 배치 안의 캐시 히트와 신규 번역도 입력 순서대로 example manager에 누적한다', async () => {
    const firstUncachedSource = 'a';
    const firstUncachedTranslation = 'A';
    const cachedSource = 'b';
    const cachedTranslation = 'B';
    const secondUncachedSource = 'c';
    const secondUncachedTranslation = 'C';
    const { service, cacheManagerService, tokenService, exampleManagerService } = createService();

    cacheManagerService.getTranslations.mockResolvedValue(
      new Map<string, string | null>([
        [firstUncachedSource, null],
        [cachedSource, cachedTranslation],
        [secondUncachedSource, null],
      ])
    );
    tokenService.getBatchGroups.mockResolvedValue([[firstUncachedSource, secondUncachedSource]]);

    const translateUncachedTexts = jest.fn().mockResolvedValue({
      batchTranslations: new Map<string, TranslationResult>([
        [firstUncachedSource, { text: firstUncachedTranslation, indices: [0] }],
        [secondUncachedSource, { text: secondUncachedTranslation, indices: [2] }],
      ]),
      response: buildResponse(),
      shouldReduceBatchSize: false,
      hasPartialData: false,
      validationMismatchTexts: new Set<string>(),
      validationMismatchTranslations: new Map<string, string>(),
    });
    (
      service as unknown as {
        translateUncachedTexts: typeof translateUncachedTexts;
      }
    ).translateUncachedTexts = translateUncachedTexts;

    const result = await service.translateText({
      requestId: 'req-interleaved-cache-hit',
      sourceTexts: [firstUncachedSource, cachedSource, secondUncachedSource],
      promptPresetContent: '',
      aiSettings: buildAiSettings(),
      cacheTag: 'default',
    });

    expect(result.texts).toEqual([
      firstUncachedTranslation,
      cachedTranslation,
      secondUncachedTranslation,
    ]);
    expect(exampleManagerService.appendCurrentExample).toHaveBeenCalledTimes(1);
    expect(exampleManagerService.appendCurrentExample).toHaveBeenCalledWith(
      'req-interleaved-cache-hit',
      SourceLanguage.ENGLISH,
      TargetLanguage.KOREAN,
      [firstUncachedSource, cachedSource, secondUncachedSource],
      [firstUncachedTranslation, cachedTranslation, secondUncachedTranslation]
    );
  });
});
