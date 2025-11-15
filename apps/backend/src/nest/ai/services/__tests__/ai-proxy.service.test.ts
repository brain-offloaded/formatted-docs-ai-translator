import { TranslationResponseParser, TranslationParsingError } from '../translation-response-parser.service';
import { AiChatResponse } from '../../dto/common-ai.dto';

describe('TranslationResponseParser.parseTranslationResponse', () => {
  const logger = { debug: jest.fn(), warn: jest.fn() };
  const service = new TranslationResponseParser(logger as unknown as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('태그 사이에 실제 개행이 포함된 번역 결과도 파싱한다', async () => {
    const response: AiChatResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: JSON.stringify({
              segments: [
                { id: 1, translated_text: '첫 줄\n둘째 줄' },
                { id: 2, translated_text: '다음 문장' },
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

    const { translations } = await service.parseTranslationResponse(response, remainingTexts);

    expect(translations.get('첫 번째 원문')?.text).toBe('첫 줄\n둘째 줄');
    expect(translations.get('두 번째 원문')?.text).toBe('다음 문장');
    expect(logger.debug).toHaveBeenCalled();
  });

  it('예제 태그 오프셋이 있는 번역 결과도 파싱한다', async () => {
    const response: AiChatResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: JSON.stringify({
              segments: [
                { id: 5, translated_text: '첫 번째 번역' },
                { id: 6, translated_text: '두 번째 번역' },
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

    const { translations } = await service.parseTranslationResponse(response, remainingTexts);

    expect(translations.get('첫 번째 문장')?.text).toBe('첫 번째 번역');
    expect(translations.get('두 번째 문장')?.text).toBe('두 번째 번역');
  });

  it('부분 JSON 응답에서 안전한 세그먼트만 복구한다', async () => {
    const response: AiChatResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content:
              '{"segments":[{"id":1,"translated_text":"A"},{"id":2,"translated_text":"B"},{"id":3,"translated_text":"C"}',
          },
        },
      ],
    };

    const remainingTexts = new Map<string, number[]>([
      ['첫 번째 문장', [0]],
      ['두 번째 문장', [1]],
      ['세 번째 문장', [2]],
    ]);

    const { translations, hasPartialData } = await service.parseTranslationResponse(
      response,
      remainingTexts
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

    const { translations, hasPartialData } = await service.parseTranslationResponse(
      response,
      remainingTexts
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

    expect(() => service.parseTranslationResponse(response, remainingTexts)).toThrow(
      TranslationParsingError
    );
  });
});
