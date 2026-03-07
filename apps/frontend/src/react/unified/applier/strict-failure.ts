import { TranslationUnit } from '../domain/translation-unit';

export const STRICT_FAILURE_MESSAGE_PREFIX = '세그먼트 번역 실패 ';

const STRICT_FAILURE_REASON_LABELS: Record<string, string> = {
  placeholder_mismatch: '플레이스홀더 불일치',
  unresolved_segment: '미해결 세그먼트',
  missing_translated_path: '응답 매핑 누락',
  unknown: '알 수 없음',
};

export const getStrictFailureMessage = (translatedTexts: TranslationUnit[]): string | null => {
  const failedSegments = translatedTexts.filter((unit) => unit.strictFailed);
  if (failedSegments.length === 0) {
    return null;
  }

  const reasons = new Set<string>();
  failedSegments.forEach((unit) => {
    (unit.strictFailureReasons ?? []).forEach((reason) => {
      if (reason.trim().length > 0) {
        reasons.add(reason.trim());
      }
    });
  });

  if (reasons.size === 0) {
    reasons.add('unknown');
  }

  const readableReasons = Array.from(reasons)
    .map((reason) => STRICT_FAILURE_REASON_LABELS[reason] ?? reason)
    .sort((a, b) => a.localeCompare(b));

  return `${STRICT_FAILURE_MESSAGE_PREFIX}${failedSegments.length}건 (${readableReasons.join(', ')})`;
};

export const isStrictFailureMessage = (message?: string): boolean =>
  typeof message === 'string' && message.startsWith(STRICT_FAILURE_MESSAGE_PREFIX);
