import { DEFAULT_CACHE_TAG } from '../constants/cache';
import type { SourceLanguage, TargetLanguage } from '../language';

/**
 * 캐시 태그 이름을 정규화합니다.
 * - 앞뒤 공백을 제거합니다.
 * - 빈 문자열인 경우 기본 캐시 태그를 반환합니다.
 * - 중간에 공백이 포함된 경우 에러를 발생시킵니다.
 */
export function normalizeCacheTag(cacheTag?: string): string {
  const trimmed = cacheTag?.trim();
  if (!trimmed || trimmed.length === 0) {
    return DEFAULT_CACHE_TAG;
  }
  if (/\s/.test(trimmed)) {
    throw new Error('캐시 태그에는 공백을 사용할 수 없습니다.');
  }
  return trimmed;
}

const sanitizeLanguageToken = (language: SourceLanguage | TargetLanguage): string =>
  language.replace(/\s+/g, '').toLowerCase();

/**
 * 언어 조합에 따라 스코프가 지정된 캐시 태그 이름을 생성합니다.
 */
export function buildLanguageScopedCacheTag(
  baseTag: string,
  sourceLanguage: SourceLanguage,
  targetLanguage: TargetLanguage
): string {
  const normalizedBase = normalizeCacheTag(baseTag);
  return `${normalizedBase}_${sanitizeLanguageToken(sourceLanguage)}-to-${sanitizeLanguageToken(targetLanguage)}`;
}
