import {
  TranslationResponseParser,
  TranslationParsingError,
} from '../translation-response-parser.service';
import { AiChatResponse } from '../../dto/common-ai.dto';

describe('TranslationResponseParser.parseTranslationResponse', () => {
  const logger = { debug: jest.fn(), warn: jest.fn() };
  const service = new TranslationResponseParser(logger as unknown as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('플레이스홀더 보존 불일치가 있는 번역 결과는 제외한다', async () => {
    const response: AiChatResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: JSON.stringify({
              segments: [
                { id: 1, text: '첫 줄\n둘째 줄' },
                { id: 2, text: '다음 문장' },
              ],
            }),
          },
        },
      ],
    };

    const remainingTexts = new Map<string, number[]>([
      ['첫 번째 원문', [0]],
      ['두 번째 원문', [1]],
    ]);
    const expectedIdToText = new Map<number, string>([
      [1, '첫 번째 원문'],
      [2, '두 번째 원문'],
    ]);

    const { translations, validationMismatchTexts } = await service.parseTranslationResponse(
      response,
      remainingTexts,
      expectedIdToText,
      {
        enabled: true,
        rules: [{ pattern: '\\n', flags: '' }],
      }
    );

    expect(translations.has('첫 번째 원문')).toBe(false);
    expect(validationMismatchTexts.has('첫 번째 원문')).toBe(true);
    expect(translations.get('두 번째 원문')?.text).toBe('다음 문장');
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      '플레이스홀더 보존 불일치로 번역 제외',
      expect.objectContaining({
        id: 1,
        originalText: '첫 번째 원문',
        translatedText: '첫 줄\n둘째 줄',
        placeholderMismatch: expect.objectContaining({
          reason: 'multiset_mismatch',
          rule: expect.objectContaining({ pattern: '\\n' }),
          unexpectedPlaceholders: expect.arrayContaining([
            expect.objectContaining({
              value: '\n',
              expectedCount: 0,
              actualCount: 1,
            }),
          ]),
        }),
      })
    );
  });

  it('플레이스홀더 매칭 문자열이 바뀌면 불일치로 처리한다', async () => {
    const response: AiChatResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: JSON.stringify({
              segments: [{ id: 1, text: '{A} love {C}' }],
            }),
          },
        },
      ],
    };

    const remainingTexts = new Map<string, number[]>([['{A} love {B}', [0]]]);
    const expectedIdToText = new Map<number, string>([[1, '{A} love {B}']]);

    const { translations, validationMismatchTexts } = await service.parseTranslationResponse(
      response,
      remainingTexts,
      expectedIdToText,
      {
        enabled: true,
        rules: [{ pattern: '\\{.+?\\}', flags: '' }],
      }
    );

    expect(translations.has('{A} love {B}')).toBe(false);
    expect(validationMismatchTexts.has('{A} love {B}')).toBe(true);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('예제 태그 오프셋이 있는 번역 결과도 파싱한다', async () => {
    const response: AiChatResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: JSON.stringify({
              segments: [
                { id: 5, text: '첫 번째 번역' },
                { id: 6, text: '두 번째 번역' },
              ],
            }),
          },
        },
      ],
    };

    const remainingTexts = new Map<string, number[]>([
      ['첫 번째 문장', [0]],
      ['두 번째 문장', [1]],
    ]);
    const expectedIdToText = new Map<number, string>([
      [5, '첫 번째 문장'],
      [6, '두 번째 문장'],
    ]);

    const { translations } = await service.parseTranslationResponse(
      response,
      remainingTexts,
      expectedIdToText
    );

    expect(translations.get('첫 번째 문장')?.text).toBe('첫 번째 번역');
    expect(translations.get('두 번째 문장')?.text).toBe('두 번째 번역');
  });

  it('부분 JSON 응답에서 안전한 세그먼트만 복구한다', async () => {
    const response: AiChatResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: '{"segments":[{"id":1,"text":"A"},{"id":2,"text":"B"},{"id":3,"text":"C"}',
          },
        },
      ],
    };

    const remainingTexts = new Map<string, number[]>([
      ['첫 번째 문장', [0]],
      ['두 번째 문장', [1]],
      ['세 번째 문장', [2]],
    ]);
    const expectedIdToText = new Map<number, string>([
      [1, '첫 번째 문장'],
      [2, '두 번째 문장'],
      [3, '세 번째 문장'],
    ]);

    const { translations, hasPartialData } = await service.parseTranslationResponse(
      response,
      remainingTexts,
      expectedIdToText
    );

    expect(hasPartialData).toBe(true);
    expect(translations.get('첫 번째 문장')?.text).toBe('A');
    expect(translations.has('두 번째 문장')).toBe(false);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('빈 응답은 partial로 처리한다', async () => {
    const response: AiChatResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: '   ',
          },
        },
      ],
    };

    const remainingTexts = new Map<string, number[]>([
      ['첫 번째 문장', [0]],
      ['두 번째 문장', [1]],
    ]);
    const expectedIdToText = new Map<number, string>([
      [1, '첫 번째 문장'],
      [2, '두 번째 문장'],
    ]);

    const { translations, hasPartialData } = await service.parseTranslationResponse(
      response,
      remainingTexts,
      expectedIdToText
    );

    expect(hasPartialData).toBe(true);
    expect(translations.size).toBe(0);
    expect(logger.warn).toHaveBeenCalledWith(
      'parseSegmentMatches: empty response payload detected',
      {
        extra: { responseLength: 3 },
      }
    );
  });
  it('JSON 파싱 실패 시 TranslationParsingError를 발생시킨다', async () => {
    const response: AiChatResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: '{invalid',
          },
        },
      ],
    };

    const remainingTexts = new Map<string, number[]>([['첫 번째 문장', [0]]]);
    const expectedIdToText = new Map<number, string>([[1, '첫 번째 문장']]);

    expect(() =>
      service.parseTranslationResponse(response, remainingTexts, expectedIdToText)
    ).toThrow(TranslationParsingError);
  });
});
