import { shouldTranslateString } from '../should-translate-string';

describe('shouldTranslateString', () => {
  test('returns false for empty or whitespace-only', () => {
    expect(shouldTranslateString('')).toBe(false);
    expect(shouldTranslateString('   ')).toBe(false);
    expect(shouldTranslateString('\n\t')).toBe(false);
  });

  test('returns false for numbers only', () => {
    expect(shouldTranslateString('123')).toBe(false);
    expect(shouldTranslateString('  00123  ')).toBe(false);
  });

  test('returns false for punctuation/symbols only', () => {
    expect(shouldTranslateString('!?.,;:')).toBe(false);
    expect(shouldTranslateString('—–-')).toBe(false);
    expect(shouldTranslateString('[]{}()')).toBe(false);
    expect(shouldTranslateString('★☆♡♥')).toBe(false);
    expect(shouldTranslateString('★☆�♡♥')).toBe(false);
  });

  test('returns true when contains letters from various scripts', () => {
    expect(shouldTranslateString('hello')).toBe(true); // Latin
    expect(shouldTranslateString('こんにちは')).toBe(true); // Japanese (Hiragana/Katakana)
    expect(shouldTranslateString('漢字')).toBe(true); // CJK
    expect(shouldTranslateString('한글')).toBe(true); // Hangul
    expect(shouldTranslateString('русский')).toBe(true); // Cyrillic
  });

  test('returns true when letters are mixed with digits/punctuations', () => {
    expect(shouldTranslateString('v2')).toBe(true);
    expect(shouldTranslateString('Part-01: 소개')).toBe(true);
    expect(shouldTranslateString('[INFO] 준비 완료')).toBe(true);
  });
});
