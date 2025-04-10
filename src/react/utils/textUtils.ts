/**
 * 텍스트 유틸리티 함수 모음
 */

/**
 * 텍스트의 길이를 제한하고 길면 말줄임표를 추가합니다
 * @param text 원본 텍스트
 * @param maxLength 최대 길이
 * @returns 축약된 텍스트
 */
export const truncateText = (text: string | null, maxLength: number = 100): string => {
  if (!text) return '-';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};
