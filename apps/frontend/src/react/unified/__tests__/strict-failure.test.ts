import {
  getStrictFailureMessage,
  isStrictFailureMessage,
} from '@/react/unified/applier/strict-failure';
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

  it('strict 실패 메시지 포맷을 판별한다', () => {
    expect(isStrictFailureMessage('세그먼트 번역 실패 1건 (플레이스홀더 불일치)')).toBe(true);
    expect(isStrictFailureMessage('일반 오류')).toBe(false);
    expect(isStrictFailureMessage(undefined)).toBe(false);
  });
});
