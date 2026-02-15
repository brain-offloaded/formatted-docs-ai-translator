export const LEGACY_TRANSLATED_TEXT_PATTERN = /\btranslated_text\b/i;

export const LEGACY_TRANSLATED_TEXT_WARNING_MESSAGE =
  '경고: prompt에 legacy 키 "translated_text"가 포함되어 있습니다. 현재 번역 응답 스키마는 "text"를 사용합니다.';

export const containsLegacyTranslatedTextKey = (text?: string): boolean => {
  if (typeof text !== 'string') return false;
  return LEGACY_TRANSLATED_TEXT_PATTERN.test(text);
};
