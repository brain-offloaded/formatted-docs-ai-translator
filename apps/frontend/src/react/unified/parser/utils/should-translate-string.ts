/**
 * 문자열이 번역이 필요할 정도로 "문자(letters)"를 포함하는지 판단합니다.
 * - 숫자(\p{N}), 문장부호/기호(\p{P}, \p{S}), 공백(\p{Z}), 제어문자(\p{C}) 만으로 구성된 경우: false 반환
 * - 그 외 유니코드 Letter(\p{L})가 하나라도 포함되면: true 반환
 *
 * 참고: 유니코드 플래그(/u)와 \p{L} 속성 이스케이프를 사용합니다.
 */
export const shouldTranslateString = (input: string): boolean => {
  if (input == null) return false;
  const text = String(input).trim();
  if (text.length === 0) return false;

  // 유니코드 Letter 가 하나라도 있으면 번역 대상
  const HAS_LETTER = /\p{L}/u;
  return HAS_LETTER.test(text);
};
