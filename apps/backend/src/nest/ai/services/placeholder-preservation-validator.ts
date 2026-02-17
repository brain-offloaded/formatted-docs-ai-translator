import { errorToString } from '@/nest/utils/error-stringify';
import type { PlaceholderPreservationSettings } from './translator.types';

type WarnLogger = (message: string, meta?: Record<string, unknown>) => void;

const MAX_MATCHES = 10000;
const MAX_LOGGED_PLACEHOLDERS = 20;

export interface PlaceholderMatchSummary {
  totalMatches: number;
  uniqueMatches: number;
  topMatches: Array<{ value: string; count: number }>;
}

export interface PlaceholderPreservationMismatchDetail {
  reason: 'multiset_mismatch' | 'before_match_build_failed' | 'after_match_build_failed';
  rule: {
    pattern: string;
    flags: string;
    normalizedFlags: string;
  };
  missingPlaceholders?: Array<{ value: string; expectedCount: number; actualCount: number }>;
  unexpectedPlaceholders?: Array<{ value: string; expectedCount: number; actualCount: number }>;
  beforeSummary?: PlaceholderMatchSummary;
  afterSummary?: PlaceholderMatchSummary;
  buildFailure?: {
    side: 'before' | 'after';
    kind: 'too_many' | 'error';
    maxMatches: number;
  };
}

const normalizeFlagsForCounting = (flags: string): string => {
  const raw = typeof flags === 'string' ? flags : '';
  const filtered = raw.replace(/[^dgimsuvy]/g, '');
  const unique = Array.from(new Set(filtered.split(''))).join('');
  return unique.includes('g') ? unique : `${unique}g`;
};

const safeCompileRule = ({
  pattern,
  flags,
  warn,
}: {
  pattern: string;
  flags: string;
  warn: WarnLogger;
}): { regex: RegExp; normalizedFlags: string } | null => {
  try {
    const normalizedFlags = normalizeFlagsForCounting(flags);
    return { regex: new RegExp(pattern, normalizedFlags), normalizedFlags };
  } catch (error) {
    warn('플레이스홀더 정규식 컴파일 실패로 규칙을 무시합니다.', {
      pattern,
      flags,
      error: errorToString(error),
    });
    return null;
  }
};

const isSameMatchMultiset = (a: Map<string, number>, b: Map<string, number>): boolean => {
  if (a.size !== b.size) return false;
  for (const [value, count] of a) {
    if (b.get(value) !== count) return false;
  }
  return true;
};

const summarizeMultiset = (multiset: Map<string, number>): PlaceholderMatchSummary => {
  let totalMatches = 0;
  const topMatches = Array.from(multiset.entries())
    .map(([value, count]) => {
      totalMatches += count;
      return { value, count };
    })
    .sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.value.localeCompare(b.value);
    })
    .slice(0, MAX_LOGGED_PLACEHOLDERS);

  return {
    totalMatches,
    uniqueMatches: multiset.size,
    topMatches,
  };
};

const buildCountDiff = (
  expected: Map<string, number>,
  actual: Map<string, number>
): Array<{ value: string; expectedCount: number; actualCount: number }> => {
  const diffs: Array<{ value: string; expectedCount: number; actualCount: number }> = [];
  const values = new Set([...expected.keys(), ...actual.keys()]);
  for (const value of values) {
    const expectedCount = expected.get(value) || 0;
    const actualCount = actual.get(value) || 0;
    if (expectedCount !== actualCount) {
      diffs.push({ value, expectedCount, actualCount });
    }
  }
  return diffs
    .sort((a, b) => {
      const deltaA = Math.abs(a.expectedCount - a.actualCount);
      const deltaB = Math.abs(b.expectedCount - b.actualCount);
      if (deltaA !== deltaB) return deltaB - deltaA;
      return a.value.localeCompare(b.value);
    })
    .slice(0, MAX_LOGGED_PLACEHOLDERS);
};

const safeBuildMatchMultiset = ({
  text,
  regex,
  warn,
}: {
  text: string;
  regex: RegExp;
  warn: WarnLogger;
}): { kind: 'ok'; multiset: Map<string, number> } | { kind: 'too_many' } | { kind: 'error' } => {
  try {
    let count = 0;
    const multiset = new Map<string, number>();
    regex.lastIndex = 0;
    while (true) {
      const match = regex.exec(text);
      if (!match) break;
      const value = match[0];
      multiset.set(value, (multiset.get(value) || 0) + 1);
      count++;
      if (count >= MAX_MATCHES) {
        warn('플레이스홀더 매칭이 너무 많아 검증에 실패합니다.', {
          maxMatches: MAX_MATCHES,
        });
        return { kind: 'too_many' };
      }
      if (value === '') {
        regex.lastIndex++;
        if (regex.lastIndex > text.length) break;
      }
    }
    return { kind: 'ok', multiset };
  } catch (error) {
    warn('플레이스홀더 매칭 카운트 실패로 검증에 실패합니다.', {
      error: errorToString(error),
    });
    return { kind: 'error' };
  }
};

export const getPlaceholderPreservationMismatchDetail = ({
  beforeText,
  afterText,
  placeholderPreservation,
  warn,
}: {
  beforeText: string;
  afterText: string;
  placeholderPreservation: PlaceholderPreservationSettings;
  warn: WarnLogger;
}): PlaceholderPreservationMismatchDetail | null => {
  for (const rule of placeholderPreservation.rules) {
    if (!rule || typeof rule.pattern !== 'string') continue;
    if (rule.enabled === false) continue;
    const pattern = rule.pattern;
    if (!pattern.trim()) continue;
    const flags = typeof rule.flags === 'string' ? rule.flags : '';
    const compiled = safeCompileRule({ pattern, flags, warn });
    if (!compiled) continue;
    const before = safeBuildMatchMultiset({ text: beforeText, regex: compiled.regex, warn });
    const after = safeBuildMatchMultiset({ text: afterText, regex: compiled.regex, warn });
    if (before.kind !== 'ok' || after.kind !== 'ok') {
      const failedBefore = before.kind !== 'ok' ? before : null;
      const failedAfter = after.kind !== 'ok' ? after : null;
      const failureSide = failedBefore ? 'before' : 'after';
      const failureKind = failedBefore?.kind ?? failedAfter?.kind;
      if (!failureKind) continue;
      return {
        reason: failedBefore ? 'before_match_build_failed' : 'after_match_build_failed',
        rule: {
          pattern,
          flags,
          normalizedFlags: compiled.normalizedFlags,
        },
        buildFailure: {
          side: failureSide,
          kind: failureKind,
          maxMatches: MAX_MATCHES,
        },
      };
    }
    if (!isSameMatchMultiset(before.multiset, after.multiset)) {
      const countDiff = buildCountDiff(before.multiset, after.multiset);
      const missingPlaceholders = countDiff.filter((item) => item.expectedCount > item.actualCount);
      const unexpectedPlaceholders = countDiff.filter(
        (item) => item.actualCount > item.expectedCount
      );
      return {
        reason: 'multiset_mismatch',
        rule: {
          pattern,
          flags,
          normalizedFlags: compiled.normalizedFlags,
        },
        missingPlaceholders,
        unexpectedPlaceholders,
        beforeSummary: summarizeMultiset(before.multiset),
        afterSummary: summarizeMultiset(after.multiset),
      };
    }
  }
  return null;
};

export const hasPlaceholderPreservationMismatch = ({
  beforeText,
  afterText,
  placeholderPreservation,
  warn,
}: {
  beforeText: string;
  afterText: string;
  placeholderPreservation: PlaceholderPreservationSettings;
  warn: WarnLogger;
}): boolean => {
  return (
    getPlaceholderPreservationMismatchDetail({
      beforeText,
      afterText,
      placeholderPreservation,
      warn,
    }) !== null
  );
};
