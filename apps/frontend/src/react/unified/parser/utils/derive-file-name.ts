import { TranslationInput } from '../../domain/translation-input';

/**
 * TranslationInput에서 파일명을 추출하는 공통 유틸리티
 * @param input TranslationInput 객체
 * @param defaultName content가 File이 아닌 경우 사용할 기본 파일명
 * @returns 파일명
 */
export function deriveFileName(input: TranslationInput, defaultName: string): string {
  if (input.content instanceof File) {
    return input.content.name;
  }
  return defaultName;
}
