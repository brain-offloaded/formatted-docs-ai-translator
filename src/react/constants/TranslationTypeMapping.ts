import { TranslationType } from '../contexts/TranslationContext';
import { BaseParseOptionsDto } from '@/nest/parser/dto/options/base-parse-options.dto';
import { CsvParserOptionsDto } from '@/nest/parser/dto/options/csv-parser-options.dto';
import { SourceLanguage } from '@/utils/language';

// 팩토리 및 레지스트리 가져오기
import { TranslatorFactory, TranslatorRegistry } from '../factories/TranslatorFactory'; // TranslatorRegistry import 추가
import { ParseOptionsFactory } from '../factories/ParseOptionsFactory';

// 공통 타입 가져오기
import {
  ParserOptionType,
  OptionComponentType,
  TranslatorComponentType,
  // TranslatorWithOptions, // 원본 주석 처리 또는 삭제
} from '../types/translation-types';
import { BaseTranslatorOptions } from '../components/translators/BaseTranslator'; // BaseTranslatorOptions import 추가

// 수정된 TranslatorWithOptions 인터페이스 정의
export interface TranslatorWithOptions<T extends TranslationType> {
  TranslatorComponent: TranslatorComponentType<T>;
  OptionComponent: OptionComponentType<T>;
  options: BaseTranslatorOptions; // options 필드 추가
}

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
): ((input: string | File[]) => boolean) => {
  // 입력 타입에 따라 유효성 검사 함수 분기
  return (input) => {
    if (Array.isArray(input)) {
      // 파일 입력 모드: 입력이 File 배열이고 요소가 있는지 확인
      // 각 요소가 File 객체인지도 확인하는 것이 더 안전하지만, 여기서는 길이만 확인
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
    case TranslationType.Subtitle:
      return '자막 번역 (SRT/VTT)';
    default:
      // never 타입을 사용하여 컴파일 타임에 모든 케이스를 처리했는지 확인
      // eslint-disable-next-line no-case-declarations
      const _exhaustiveCheck: never = type;
      throw new Error(`Invalid translation type: ${_exhaustiveCheck}`);
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
  // TranslatorConfig에서 options 가져오기 (TranslatorRegistry 사용)
  const config = TranslatorRegistry.getInstance().getConfig(type); // TranslatorRegistry 사용
  if (!config) {
    throw new Error(`번역기 설정을 찾을 수 없습니다: ${type}`);
  }

  return {
    TranslatorComponent,
    OptionComponent,
    options: config.options, // options 반환 객체에 추가
  };
}
