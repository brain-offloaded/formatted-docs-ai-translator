import { TranslationType } from '../contexts/TranslationContext';
import { BaseParseOptionsDto } from '@/nest/parser/dto/base-parse-options.dto';
import { CsvParserOptionsDto } from '@/nest/parser/dto/options/csv-parser-options.dto';
import { SourceLanguage } from '@/utils/language';

// 팩토리 가져오기
import { TranslatorFactory } from '../factories/TranslatorFactory';
import { ParseOptionsFactory } from '../factories/ParseOptionsFactory';

// 공통 타입 가져오기
import {
  ParserOptionType,
  OptionComponentType,
  TranslatorComponentType,
  TranslatorWithOptions,
} from '../types/translation-types';

/**
 * 번역 타입에 따른 기본 옵션을 반환하는 함수
 * @param translationType 번역 유형
 * @param sourceLanguage 소스 언어
 * @returns 해당 번역 유형에 맞는 기본 옵션
 */
export const getDefaultOptions = (
  translationType: TranslationType,
  sourceLanguage: SourceLanguage
): ParserOptionType => {
  switch (translationType) {
    case TranslationType.Csv:
      return {
        sourceLanguage,
        delimiter: ',',
        replaceDelimiter: ';',
        skipFirstLine: false,
        isFile: false,
      } as CsvParserOptionsDto;
    default:
      return {
        sourceLanguage,
        isFile: false,
      } as BaseParseOptionsDto;
  }
};

/**
 * TranslationType에 따라 적절한 컴포넌트를 반환하는 함수
 * @param type 번역 유형
 * @returns 해당 번역 유형에 맞는 React 컴포넌트
 */
export function getTranslatorComponent<T extends TranslationType>(
  type: T
): TranslatorComponentType<T> {
  return TranslatorFactory.createTranslator(type);
}

/**
 * TranslationType에 따라 적절한 옵션 컴포넌트를 반환하는 함수
 * @param type 번역 유형
 * @returns 해당 번역 유형에 맞는 옵션 컴포넌트
 */
export function getParserOptionComponent<T extends TranslationType>(
  type: T
): OptionComponentType<T> {
  return ParseOptionsFactory.createParseOptions(type);
}

/**
 * 파일 모드에 따른 기본 유효성 검사 함수를 반환하는 함수
 * @param translationType 번역 타입 (JSON 문자열 여부 등 확인용)
 * @returns 해당 모드에 맞는 유효성 검사 함수
 */
export const getDefaultValidatorByMode = (
  translationType: TranslationType
): ((input: string | string[]) => boolean) => {
  // 입력 타입에 따라 유효성 검사 함수 분기
  return (input) => {
    if (Array.isArray(input)) {
      // 파일 입력 모드: 입력이 배열이고 요소가 있는지 확인
      return input.length > 0;
    } else if (typeof input === 'string') {
      // 텍스트 입력 모드
      if (translationType === TranslationType.Json) {
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
  switch (type) {
    case TranslationType.Json:
      return 'JSON 번역';
    case TranslationType.Text:
      return '텍스트 번역';
    case TranslationType.Csv:
      return 'CSV 번역';
    default:
      throw new Error('Invalid translation type');
  }
};

/**
 * TranslationType 목록을 반환하는 함수
 * @returns TranslationType 배열
 */
export const getTranslationTypes = (): { value: TranslationType; label: string }[] => {
  // Object.values 사용 시 enum의 숫자 값과 문자열 키가 모두 포함될 수 있으므로 필터링
  return Object.values(TranslationType).map((type) => ({
    value: type,
    label: getTranslationTypeLabel(type),
  }));
};

/**
 * TranslationType에 따라 번역기 컴포넌트와 옵션 컴포넌트를 함께 반환하는 함수
 * @param type 번역 유형
 * @returns 번역기 컴포넌트와 옵션 컴포넌트를 포함하는 객체
 */
export function getTranslatorWithOptions<T extends TranslationType>(
  type: T
): TranslatorWithOptions<T> {
  const TranslatorComponent = getTranslatorComponent<T>(type);
  const OptionComponent = getParserOptionComponent<T>(type);

  return {
    TranslatorComponent,
    OptionComponent,
  };
}
