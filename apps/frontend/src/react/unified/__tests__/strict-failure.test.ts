import { getStrictFailureMessage } from '@/react/unified/applier/strict-failure';
import { TranslationUnit } from '@/react/unified/domain/translation-unit';

describe('strict failure message', () => {
  it('strictFailureReasons가 비어 있으면 알 수 없음 라벨을 사용한다', () => {
    const translatedTexts: TranslationUnit[] = [
      {
        key: '0',
        source: 'source',
        target: 'target',
        strictFailed: true,
      },
    ];

    const message = getStrictFailureMessage(translatedTexts);

    expect(message).toContain('알 수 없음');
    expect(message).not.toContain('unknown');
  });
});
