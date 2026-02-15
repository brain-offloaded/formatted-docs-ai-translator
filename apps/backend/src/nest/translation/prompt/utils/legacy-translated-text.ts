export const LEGACY_TRANSLATED_TEXT_PATTERN = /\btranslated_text\b/i;

export const LEGACY_TRANSLATED_TEXT_WARNING =
  '경고: prompt에 legacy 키 "translated_text"가 포함되어 있습니다. 현재 응답 스키마는 "text"를 사용합니다.';

export const containsLegacyTranslatedTextKey = (prompt?: string): boolean => {
  if (typeof prompt !== 'string') return false;
  return LEGACY_TRANSLATED_TEXT_PATTERN.test(prompt);
};

export const appendLegacyWarningMessage = (baseMessage: string): string =>
  `${baseMessage} ${LEGACY_TRANSLATED_TEXT_WARNING}`;
