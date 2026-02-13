import { errorToString } from '@/nest/utils/error-stringify';
import type { PlaceholderPreservationSettings } from './translator.types';

type WarnLogger = (message: string, meta?: Record<string, unknown>) => void;

const MAX_MATCHES = 10000;

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
}): RegExp | null => {
  try {
    const normalizedFlags = normalizeFlagsForCounting(flags);
    return new RegExp(pattern, normalizedFlags);
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
  for (const rule of placeholderPreservation.rules) {
    if (!rule || typeof rule.pattern !== 'string') continue;
    const pattern = rule.pattern;
    if (!pattern.trim()) continue;
    const flags = typeof rule.flags === 'string' ? rule.flags : '';
    const compiled = safeCompileRule({ pattern, flags, warn });
    if (!compiled) continue;
    const before = safeBuildMatchMultiset({ text: beforeText, regex: compiled, warn });
    const after = safeBuildMatchMultiset({ text: afterText, regex: compiled, warn });
    if (before.kind !== 'ok' || after.kind !== 'ok') {
      return true;
    }
    if (!isSameMatchMultiset(before.multiset, after.multiset)) return true;
  }
  return false;
};
