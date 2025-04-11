import { TranslationType } from '../contexts/TranslationContext';

// 나중에 생성할 컴포넌트 타입 가져오기
import JsonFileTranslator from '../components/translators/JsonFileTranslator';
import JsonStringTranslator from '../components/translators/JsonStringTranslator';
import TextTranslator from '../components/translators/TextTranslator';
import CsvFileTranslator from '../components/translators/CsvFileTranslator';

// 옵션 컴포넌트
import JsonFileParseOption from '../components/options/JsonFileParseOption';
import JsonStringParseOption from '../components/options/JsonStringParseOption';
import TextParseOption from '../components/options/TextParseOption';
import CsvFileParseOption from '../components/options/CsvFileParseOption';
import { BaseParseOptionsDto } from '@/nest/parser/dto/base-parse-options.dto';
import { CsvParserOptionsDto } from '@/nest/parser/dto/options/csv-parser-options.dto';
import { SourceLanguage } from '@/utils/language';

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
    case TranslationType.CsvFile:
      return {
        sourceLanguage,
        delimiter: ',',
        replaceDelimiter: ';',
        skipFirstLine: false,
      } as CsvParserOptionsDto;
    default:
      return {
        sourceLanguage,
      } as BaseParseOptionsDto;
  }
};

// Translator Component Map
const translatorComponentMap: {
  [K in TranslationType]: TranslatorComponentType<K>;
} = {
  [TranslationType.JsonFile]: JsonFileTranslator,
  [TranslationType.JsonString]: JsonStringTranslator,
  [TranslationType.Text]: TextTranslator,
  [TranslationType.CsvFile]: CsvFileTranslator,
};

/**
 * TranslationType에 따라 적절한 컴포넌트를 반환하는 함수
 * @param type 번역 유형
 * @returns 해당 번역 유형에 맞는 React 컴포넌트
 */
export function getTranslatorComponent<T extends TranslationType>(
  type: T
): TranslatorComponentType<T> {
  const component = translatorComponentMap[type];
  if (!component) {
    // 이론적으로는 도달할 수 없지만, 안전을 위해 추가
    throw new Error(`Invalid translation type: ${type}`);
  }
  // 이제 TypeScript는 component의 타입이 TranslatorComponentType<T>임을 정확히 추론합니다.
  return component;
}

// Parser Option Component Map
const parserOptionComponentMap: {
  [K in TranslationType]: OptionComponentType<K>;
} = {
  [TranslationType.JsonFile]: JsonFileParseOption,
  [TranslationType.JsonString]: JsonStringParseOption,
  [TranslationType.Text]: TextParseOption,
  [TranslationType.CsvFile]: CsvFileParseOption,
};

/**
 * TranslationType에 따라 적절한 옵션 컴포넌트를 반환하는 함수
 * @param type 번역 유형
 * @returns 해당 번역 유형에 맞는 옵션 컴포넌트
 */
export function getParserOptionComponent<T extends TranslationType>(
  type: T
): OptionComponentType<T> {
  const component = parserOptionComponentMap[type];
  if (!component) {
    // 이론적으로는 도달할 수 없지만, 안전을 위해 추가
    throw new Error(`Invalid translation type: ${type}`);
  }
  // TypeScript는 component의 타입이 OptionComponentType<T>임을 정확히 추론합니다.
  return component;
}

/**
 * 입력 타입이 파일 기반인지 확인하는 함수
 * @param translationType 번역 타입
 * @returns 파일 기반 입력인 경우 true, 아닌 경우 false
 */
export const isFileInput = (translationType: TranslationType): boolean => {
  return (
    translationType === TranslationType.JsonFile || translationType === TranslationType.CsvFile
  );
};

/**
 * 출력 결과를 다운로드할 수 있는지 확인하는 함수
 * @param translationType 번역 타입
 * @returns 다운로드 가능한 경우 true, 아닌 경우 false
 */
export const isDownloadable = (translationType: TranslationType): boolean => {
  return isFileInput(translationType);
};

/**
 * 기본 초기 입력값 생성 함수
 * @param translationType 번역 타입
 * @returns 해당 번역 타입에 맞는 기본 초기 입력값
 */
export const getDefaultInitialInput = (translationType: TranslationType): string | string[] => {
  if (isFileInput(translationType)) {
    return []; // 파일 입력은 빈 배열로 초기화
  } else {
    return ''; // 문자열 입력은 빈 문자열로 초기화
  }
};

/**
 * 기본 유효성 검사 함수를 반환하는 함수
 * @param translationType 번역 타입
 * @returns 해당 번역 타입에 맞는 유효성 검사 함수
 */
export const getDefaultValidator = (
  translationType: TranslationType
): ((input: string | string[]) => boolean) => {
  if (isFileInput(translationType)) {
    // 입력이 배열이고 요소가 있는지 확인
    return (input) => Array.isArray(input) && input.length > 0;
  } else if (translationType === TranslationType.JsonString) {
    // 입력이 문자열이고 유효한 JSON인지 확인
    return (input) => {
      if (typeof input !== 'string') return false;
      try {
        JSON.parse(input.trim());
        // 빈 JSON 문자열도 유효하다고 간주할 수 있으나, 여기서는 비어있지 않은지만 확인
        // 필요하다면 `input.trim() === '{}'` 또는 `input.trim() === '[]'` 같은 추가 검사 가능
        return input.trim().length > 0;
      } catch (e) {
        return false;
      }
    };
  } else {
    // 입력이 문자열이고 공백 제거 후 비어있지 않은지 확인
    return (input) => typeof input === 'string' && input.trim().length > 0;
  }
};

/**
 * TranslationType에 따라 적절한 라벨 문자열을 반환하는 함수
 * @param type 번역 유형
 * @returns 해당 번역 유형에 맞는 라벨 문자열
 */
export const getTranslationTypeLabel = (type: TranslationType): string => {
  switch (type) {
    case TranslationType.JsonFile:
      return 'JSON 파일 번역';
    case TranslationType.JsonString:
      return 'JSON 문자열 번역';
    case TranslationType.Text:
      return '텍스트 번역';
    case TranslationType.CsvFile:
      return 'CSV 파일 번역';
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
  return Object.values(TranslationType)
    .filter((value): value is TranslationType => typeof value === 'number')
    .map((type) => ({
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
