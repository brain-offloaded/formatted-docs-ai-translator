jest.mock('../../../../ai/services/unified-ai-translator.service', () => ({
  UnifiedAiTranslatorService: class {},
}));

import { TranslatorService } from '../translator.service';
import { UnifiedAiTranslatorService } from '../../../../ai/services/unified-ai-translator.service';

describe('TranslatorService preprocess/postprocess', () => {
  const service = new TranslatorService({} as unknown as UnifiedAiTranslatorService);
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
