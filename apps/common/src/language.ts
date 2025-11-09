export enum Language {
  ANY = 'any',
  KOREAN = 'ko',
  ENGLISH = 'en',
  JAPANESE = 'ja',
  CHINESE = 'zh',
}

export enum SourceLanguage {
  ANY = Language.ANY,
  KOREAN = Language.KOREAN,
  ENGLISH = Language.ENGLISH,
  JAPANESE = Language.JAPANESE,
  CHINESE = Language.CHINESE,
}

export enum TargetLanguage {
  KOREAN = Language.KOREAN,
  ENGLISH = Language.ENGLISH,
  JAPANESE = Language.JAPANESE,
  CHINESE = Language.CHINESE,
}

export interface LanguageMetadata {
  id: Language;
  labels: {
    en: string;
    ko: string;
  };
  // UI에서 노출 가능한 언어만 true
  supportsUI?: boolean;
}

type LanguageDefinition = Omit<LanguageMetadata, 'id'>;

const LANGUAGE_DEFINITIONS: Record<Language, LanguageDefinition> = {
  [Language.ANY]: {
    labels: {
      en: 'Any Language',
      ko: '모든 언어',
    },
  },
  [Language.KOREAN]: {
    labels: {
      en: 'Korean',
      ko: '한국어',
    },
    supportsUI: true,
  },
  [Language.ENGLISH]: {
    labels: {
      en: 'English',
      ko: '영어',
    },
    supportsUI: true,
  },
  [Language.JAPANESE]: {
    labels: {
      en: 'Japanese',
      ko: '일본어',
    },
    supportsUI: true,
  },
  [Language.CHINESE]: {
    labels: {
      en: 'Chinese',
      ko: '중국어',
    },
    supportsUI: true,
  },
};

export const languageMetadata: LanguageMetadata[] = Object.entries(LANGUAGE_DEFINITIONS).map(
  ([id, definition]) => ({
    id: id as Language,
    ...definition,
  })
);

export const sourceLanguages = Object.values(SourceLanguage) as SourceLanguage[];
export const targetLanguages = Object.values(TargetLanguage) as TargetLanguage[];
export const uiLanguages: Language[] = languageMetadata
  .filter((meta) => meta.supportsUI ?? false)
  .map((m) => m.id);

export const defaultSourceLanguage: SourceLanguage = SourceLanguage.ENGLISH;
export const defaultTargetLanguage: TargetLanguage = TargetLanguage.KOREAN;

type SupportedLanguage = Language | SourceLanguage | TargetLanguage;

const getLanguageMetadata = (language: SupportedLanguage): LanguageMetadata | undefined => {
  const def = LANGUAGE_DEFINITIONS[language as Language];
  return def ? { id: language as Language, ...def } : undefined;
};

export const getLanguageLabel = (
  language: SupportedLanguage,
  locale: 'en' | 'ko' = 'en'
): string => {
  const meta = getLanguageMetadata(language);
  if (!meta) return language as string;
  return meta.labels[locale] ?? meta.labels.en;
};

export const getLanguageLabelByCode = (code: string, locale: 'en' | 'ko' = 'en'): string => {
  if (Object.prototype.hasOwnProperty.call(LANGUAGE_DEFINITIONS, code)) {
    return getLanguageLabel(code as Language, locale);
  }
  return code;
};

const hasTrimmedContent = (value: string): value is string => !!value?.trim();
const createRegexDetector =
  (pattern: RegExp) =>
  (value: string): boolean =>
    hasTrimmedContent(value) ? pattern.test(value.trim()) : false;

const JAPANESE_REGEX = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uFF61-\uFF9F]/;
const CHINESE_REGEX = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;
const ENGLISH_REGEX = /[a-zA-Z]/;
const KOREAN_REGEX = /[\uAC00-\uD7A3]/;

export const isJapanese = createRegexDetector(JAPANESE_REGEX);
export const isChinese = createRegexDetector(CHINESE_REGEX);

export const isEnglish = (value: string): boolean => {
  if (!hasTrimmedContent(value)) return false;

  if (/^[A-Za-z0-9+/=%_-]*[A-Za-z][A-Za-z0-9+/=%_-]*$/.test(value.trim())) {
    return true;
  }

  return ENGLISH_REGEX.test(value);
};

export const isKorean = createRegexDetector(KOREAN_REGEX);

export const isLanguage = (value: string, language: SupportedLanguage): boolean => {
  switch (language) {
    case Language.ANY:
      return true;
    case Language.JAPANESE:
      return isJapanese(value);
    case Language.CHINESE:
      return isChinese(value);
    case Language.ENGLISH:
      return isEnglish(value);
    case Language.KOREAN:
      return isKorean(value);
    default:
      return true;
  }
};

const UNICODE = {
  ASCII_DIGIT_START: 0x30,
  ASCII_DIGIT_END: 0x39,
  ASCII_UPPER_START: 0x41,
  ASCII_UPPER_END: 0x5a,
  ASCII_LOWER_START: 0x61,
  ASCII_LOWER_END: 0x7a,
  FULL_DIGIT_START: 0xff10,
  FULL_DIGIT_END: 0xff19,
  FULL_UPPER_START: 0xff21,
  FULL_UPPER_END: 0xff3a,
  FULL_LOWER_START: 0xff41,
  FULL_LOWER_END: 0xff5a,
  WIDTH_CONVERSION_OFFSET: 0xfee0,
};

const PUNCTUATION_MAPS = {
  halfToFull: {
    '!': '！',
    '"': '＂',
    '#': '＃',
    $: '＄',
    '%': '％',
    '&': '＆',
    "'": '＇',
    '(': '（',
    ')': '）',
    '*': '＊',
    '+': '＋',
    ',': '，',
    '-': '－',
    '.': '．',
    '/': '／',
    ':': '：',
    ';': '；',
    '<': '＜',
    '=': '＝',
    '>': '＞',
    '?': '？',
    '@': '＠',
    '[': '［',
    '\\': '＼',
    ']': '］',
    '^': '＾',
    _: '＿',
    '`': '｀',
    '{': '｛',
    '|': '｜',
    '}': '｝',
    '~': '～',
    ' ': '　',
  },
  fullToHalf: {
    '！': '!',
    '＂': '"',
    '＃': '#',
    '＄': '$',
    '％': '%',
    '＆': '&',
    '＇': "'",
    '（': '(',
    '）': ')',
    '＊': '*',
    '＋': '+',
    '，': ',',
    '－': '-',
    '．': '.',
    '／': '/',
    '：': ':',
    '；': ';',
    '＜': '<',
    '＝': '=',
    '＞': '>',
    '？': '?',
    '＠': '@',
    '［': '[',
    '＼': '\\',
    '］': ']',
    '＾': '^',
    '＿': '_',
    '｀': '`',
    '｛': '{',
    '｜': '|',
    '｝': '}',
    '～': '~',
    '　': ' ',
  },
};

type WidthConversion = 'halfToFull' | 'fullToHalf';

const convertChar = (char: string, type: WidthConversion): string => {
  const code = char.charCodeAt(0);

  if (type === 'halfToFull') {
    if (code >= UNICODE.ASCII_DIGIT_START && code <= UNICODE.ASCII_DIGIT_END) {
      return String.fromCharCode(code + UNICODE.WIDTH_CONVERSION_OFFSET);
    }
    if (code >= UNICODE.ASCII_UPPER_START && code <= UNICODE.ASCII_UPPER_END) {
      return String.fromCharCode(code + UNICODE.WIDTH_CONVERSION_OFFSET);
    }
    if (code >= UNICODE.ASCII_LOWER_START && code <= UNICODE.ASCII_LOWER_END) {
      return String.fromCharCode(code + UNICODE.WIDTH_CONVERSION_OFFSET);
    }
    return PUNCTUATION_MAPS.halfToFull[char as keyof typeof PUNCTUATION_MAPS.halfToFull] || char;
  }

  if (code >= UNICODE.FULL_DIGIT_START && code <= UNICODE.FULL_DIGIT_END) {
    return String.fromCharCode(code - UNICODE.WIDTH_CONVERSION_OFFSET);
  }
  if (code >= UNICODE.FULL_UPPER_START && code <= UNICODE.FULL_UPPER_END) {
    return String.fromCharCode(code - UNICODE.WIDTH_CONVERSION_OFFSET);
  }
  if (code >= UNICODE.FULL_LOWER_START && code <= UNICODE.FULL_LOWER_END) {
    return String.fromCharCode(code - UNICODE.WIDTH_CONVERSION_OFFSET);
  }
  return PUNCTUATION_MAPS.fullToHalf[char as keyof typeof PUNCTUATION_MAPS.fullToHalf] || char;
};

const convertWidth = (value: string, type: WidthConversion): string =>
  Array.from(value)
    .map((char) => convertChar(char, type))
    .join('');

export const convertHalfWidthToFullWidth = (value: string): string =>
  value ? convertWidth(value, 'halfToFull') : value;

export const convertFullWidthToHalfWidth = (value: string): string =>
  value ? convertWidth(value, 'fullToHalf') : value;
