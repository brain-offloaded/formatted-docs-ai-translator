jest.mock('../../../../ai/services/text-batch-translation.service', () => ({
  TextBatchTranslationService: class {},
}));

import { TranslatorService } from '../translator.service';
import { TextBatchTranslationService } from '../../../../ai/services/text-batch-translation.service';
import {
  ModelProvider,
  TranslatorAiSettings,
} from '@/nest/translator/common/dto/translator-settings.dto';
import { SourceLanguage, TargetLanguage } from '@apps/common/dist/language';
import { TranslateTextArrayRequestDto } from '../../dto/request/translate-text-array-request.dto';

describe('TranslatorService preprocess/postprocess', () => {
  const service = new TranslatorService({} as unknown as TextBatchTranslationService);
  const preprocessText = (
    service as unknown as { preprocessText: (text: string) => string }
  ).preprocessText.bind(service);
  const postprocessText = (
    service as unknown as { postprocessText: (text: string) => string }
  ).postprocessText.bind(service);

  it('전처리와 후처리 후에도 실제 개행 문자를 유지한다', () => {
    const original = '첫 줄\n둘째 줄';

    const preprocessed = preprocessText(original);
    const postprocessed = postprocessText(preprocessed);

    expect(preprocessed).toBe('첫 줄\n둘째 줄');
    expect(postprocessed).toBe(original);
  });

  it('전처리와 후처리 후에도 리터럴 \\n 문자열을 그대로 유지한다', () => {
    const original = '문장\\n다음';

    const preprocessed = preprocessText(original);
    const postprocessed = postprocessText(preprocessed);

    expect(preprocessed).toBe(original);
    expect(postprocessed).toBe(original);
  });
});

describe('TranslatorService translate strict metadata', () => {
  const aiSettings: TranslatorAiSettings = {
    modelProvider: ModelProvider.OPENAI_COMPATIBLE,
    sourceLanguage: SourceLanguage.ENGLISH,
    targetLanguage: TargetLanguage.KOREAN,
    apiKey: 'key',
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
  };

  it('strict 실패 메타데이터를 extra에 반영한다', async () => {
    const textBatchTranslationService = {
      translateText: jest.fn().mockResolvedValue({
        texts: ['안녕하세요', '원문 유지'],
        strictMetaByIndex: [
          {
            strictFailed: false,
            strictFailureReasons: [],
            strictFailureCount: 0,
          },
          {
            strictFailed: true,
            strictFailureReasons: ['placeholder_mismatch'],
            strictFailureCount: 1,
          },
        ],
      }),
    } as unknown as TextBatchTranslationService;

    const service = new TranslatorService(textBatchTranslationService);
    const result = await service.translate({
      requestId: 'req-strict-meta',
      aiSettings,
      textPaths: [
        { text: 'hello', path: 'line_0' },
        { text: 'world', path: 'line_1', extra: { source: 'unit-test' } },
      ],
      promptPresetContent: '',
      cacheTag: 'default',
    } as TranslateTextArrayRequestDto);

    expect(result[0].extra).toEqual({
      strictFailed: false,
      strictFailureReasons: [],
      strictFailureCount: 0,
    });
    expect(result[1].extra).toEqual({
      source: 'unit-test',
      strictFailed: true,
      strictFailureReasons: ['placeholder_mismatch'],
      strictFailureCount: 1,
    });
  });
});
