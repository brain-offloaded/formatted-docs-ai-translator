export const enum Language {
  KOREAN = 'Korean',
  ENGLISH = 'English',
  JAPANESE = 'Japanese',
  CHINESE = 'Chinese',
}

export type SourceLanguage = Language.CHINESE | Language.ENGLISH | Language.JAPANESE;
export type TargetLanguage = Language.KOREAN;
export const targetLanguage = Language.KOREAN;

export const isJapanese = (str: string): boolean => {
  str = str.trim();
  if (!str) return false;

  // 일본어 문자 범위
  const HIRAGANA = '\u3040-\u309F'; // 히라가나
  const KATAKANA = '\u30A0-\u30FF'; // 가타카나
  const KANJI = '\u4E00-\u9FAF'; // 한자
  const HALF_KATAKANA = '\uFF61-\uFF9F'; // 반각 가타카나

  // 전체 패턴
  const japanesePattern = new RegExp(`[${HIRAGANA}${KATAKANA}${KANJI}${HALF_KATAKANA}]`);

  // 문자열이 일본어 문자를 포함하고 있는지만 검사
  return japanesePattern.test(str);
};

export const isChinese = (str: string): boolean => {
  str = str.trim();
  if (!str) return false;

  // 중국어 문자 범위
  const HANZI = '\u4E00-\u9FFF'; // 기본 한자
  const HANZI_EXT_A = '\u3400-\u4DBF'; // 한자 확장 A
  const HANZI_COMPAT = '\uF900-\uFAFF'; // 호환용 한자

  // 전체 패턴 - 중국어 문자 감지만 확인
  const chinesePattern = new RegExp(`[${HANZI}${HANZI_EXT_A}${HANZI_COMPAT}]`);

  // 문자열이 중국어 문자를 포함하고 있는지만 검사
  return chinesePattern.test(str);
};

export const isEnglish = (str: string): boolean => {
  str = str.trim();
  if (!str) return false;

  // API 키, 토큰, 인코딩된 문자열 패턴 (일반적으로 영어로 처리)
  if (/^[A-Za-z0-9+/=%_-]*[A-Za-z][A-Za-z0-9+/=%_-]*$/.test(str)) {
    return true;
  }

  // 영어 문자 및 문장에서 자주 사용되는 문자들
  const LETTERS = 'a-zA-Z'; // 영문 알파벳

  // 전체 패턴: 영어 문자가 하나라도 있으면 영어 문자열로 간주
  const englishLetterPattern = new RegExp(`[${LETTERS}]`);

  // 영어 알파벳을 하나 이상 포함하고 있는지만 확인
  return englishLetterPattern.test(str);
};

export const isKorean = (str: string): boolean => {
  if (!str) return false;
  const koreanRegex = /[\uAC00-\uD7A3]/;
  return koreanRegex.test(str);
};

export const isLanguage = (str: string, language: Language): boolean => {
  if (typeof str !== 'string') return false;
  str = str.trim();
  if (!str) return false;

  switch (language) {
    case Language.JAPANESE:
      return isJapanese(str);
    case Language.CHINESE:
      return isChinese(str);
    case Language.ENGLISH:
      return isEnglish(str);
    case Language.KOREAN:
      return isKorean(str);
    default:
      return false;
  }
};

// 유니코드 문자 범위 상수
const UNICODE = {
  // ASCII 범위
  ASCII_DIGIT_START: 0x30, // 0
  ASCII_DIGIT_END: 0x39, // 9
  ASCII_UPPER_START: 0x41, // A
  ASCII_UPPER_END: 0x5a, // Z
  ASCII_LOWER_START: 0x61, // a
  ASCII_LOWER_END: 0x7a, // z

  // 전각 문자 범위
  FULL_DIGIT_START: 0xff10, // ０
  FULL_DIGIT_END: 0xff19, // ９
  FULL_UPPER_START: 0xff21, // Ａ
  FULL_UPPER_END: 0xff3a, // Ｚ
  FULL_LOWER_START: 0xff41, // ａ
  FULL_LOWER_END: 0xff5a, // ｚ

  // 전각/반각 변환 오프셋
  WIDTH_CONVERSION_OFFSET: 0xfee0,
};

// 문장부호 매핑 상수
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
    ' ': '　', // 반각 공백을 전각 공백으로
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
    '　': ' ', // 전각 공백을 반각 공백으로
  },
};

/**
 * 단일 문자를 반각에서 전각으로 또는 전각에서 반각으로 변환
 */
const convertChar = (char: string, type: 'halfToFull' | 'fullToHalf'): string => {
  const code = char.charCodeAt(0);

  // 숫자, 알파벳 변환
  if (type === 'halfToFull') {
    // 숫자 (0-9) → (０-９)
    if (code >= UNICODE.ASCII_DIGIT_START && code <= UNICODE.ASCII_DIGIT_END) {
      return String.fromCharCode(code + UNICODE.WIDTH_CONVERSION_OFFSET);
    }
    // 대문자 (A-Z) → (Ａ-Ｚ)
    if (code >= UNICODE.ASCII_UPPER_START && code <= UNICODE.ASCII_UPPER_END) {
      return String.fromCharCode(code + UNICODE.WIDTH_CONVERSION_OFFSET);
    }
    // 소문자 (a-z) → (ａ-ｚ)
    if (code >= UNICODE.ASCII_LOWER_START && code <= UNICODE.ASCII_LOWER_END) {
      return String.fromCharCode(code + UNICODE.WIDTH_CONVERSION_OFFSET);
    }
    // 문장부호
    return PUNCTUATION_MAPS.halfToFull[char as keyof typeof PUNCTUATION_MAPS.halfToFull] || char;
  } else {
    // 숫자 (０-９) → (0-9)
    if (code >= UNICODE.FULL_DIGIT_START && code <= UNICODE.FULL_DIGIT_END) {
      return String.fromCharCode(code - UNICODE.WIDTH_CONVERSION_OFFSET);
    }
    // 대문자 (Ａ-Ｚ) → (A-Z)
    if (code >= UNICODE.FULL_UPPER_START && code <= UNICODE.FULL_UPPER_END) {
      return String.fromCharCode(code - UNICODE.WIDTH_CONVERSION_OFFSET);
    }
    // 소문자 (ａ-ｚ) → (a-z)
    if (code >= UNICODE.FULL_LOWER_START && code <= UNICODE.FULL_LOWER_END) {
      return String.fromCharCode(code - UNICODE.WIDTH_CONVERSION_OFFSET);
    }
    // 문장부호
    return PUNCTUATION_MAPS.fullToHalf[char as keyof typeof PUNCTUATION_MAPS.fullToHalf] || char;
  }
};

/**
 * 문자열의 모든 반각 문자를 전각 문자로 변환
 */
export const convertHalfWidthToFullWidth = (str: string): string => {
  if (!str) return str;

  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += convertChar(str[i], 'halfToFull');
  }
  return result;
};

/**
 * 문자열의 모든 전각 문자를 반각 문자로 변환
 */
export const convertFullWidthToHalfWidth = (str: string): string => {
  if (!str) return str;

  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += convertChar(str[i], 'fullToHalf');
  }
  return result;
};
