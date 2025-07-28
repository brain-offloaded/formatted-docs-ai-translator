import { TranslationType } from '../contexts/TranslationContext';
import { translationConfigs } from '../config/translation-configs';

/**
 * 파일 모드에 따른 기본 유효성 검사 함수를 반환하는 함수
 * @param translationType 번역 타입 (JSON 문자열 여부 등 확인용)
 * @returns 해당 모드에 맞는 유효성 검사 함수
 */
export const getDefaultValidatorByMode = (
  translationType: TranslationType
): ((input: string | File[]) => boolean) => {
  // 입력 타입에 따라 유효성 검사 함수 분기
  return (input) => {
    if (Array.isArray(input)) {
      // 파일 입력 모드: 입력이 File 배열이고 요소가 있는지 확인
      // 각 요소가 File 객체인지도 확인하는 것이 더 안전하지만, 여기서는 길이만 확인
      return input.length > 0;
    } else if (typeof input === 'string') {
      // 텍스트 입력 모드
      if (translationType === 'json') {
        // 입력이 문자열이고 유효한 JSON인지 확인
        try {
          JSON.parse(input.trim());
          // 빈 JSON 문자열도 유효하다고 간주할 수 있으나, 여기서는 비어있지 않은지만 확인
          return input.trim().length > 0;
        } catch (e) {
          return false;
        }
      } else {
        // 입력이 문자열이고 공백 제거 후 비어있지 않은지 확인
        return input.trim().length > 0;
      }
    }
    // 그 외의 경우 (undefined, null 등)는 유효하지 않음
    return false;
  };
};

/**
 * TranslationType에 따라 적절한 라벨 문자열을 반환하는 함수
 * @param type 번역 유형
 * @returns 해당 번역 유형에 맞는 라벨 문자열
 */
export const getTranslationTypeLabel = (type: TranslationType): string => {
  const config = translationConfigs.find((c) => c.type === type);
  return config ? config.label : '알 수 없는 번역';
};

/**
 * TranslationType 목록을 반환하는 함수
 * @returns TranslationType 배열
 */
export const getTranslationTypes = (): { value: TranslationType; label: string }[] => {
  return translationConfigs.map((config) => ({
    value: config.type,
    label: config.label,
  }));
};
