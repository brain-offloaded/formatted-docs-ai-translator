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

/**
 * TranslationType에 따라 적절한 컴포넌트를 반환하는 함수
 * @param type 번역 유형
 * @returns 해당 번역 유형에 맞는 React 컴포넌트
 */
export function getTranslatorComponent<T extends TranslationType>(
  type: T
): TranslatorComponentType<T> {
  switch (type) {
    case TranslationType.JsonFile:
      return JsonFileTranslator as unknown as TranslatorComponentType<T>;
    case TranslationType.JsonString:
      return JsonStringTranslator as unknown as TranslatorComponentType<T>;
    case TranslationType.Text:
      return TextTranslator as unknown as TranslatorComponentType<T>;
    case TranslationType.CsvFile:
      return CsvFileTranslator as unknown as TranslatorComponentType<T>;
    default:
      throw new Error('Invalid translation type');
  }
}

/**
 * TranslationType에 따라 적절한 옵션 컴포넌트를 반환하는 함수
 * @param type 번역 유형
 * @returns 해당 번역 유형에 맞는 옵션 컴포넌트
 */
export function getParserOptionComponent<T extends TranslationType>(
  type: T
): OptionComponentType<T> {
  switch (type) {
    case TranslationType.JsonFile:
      return JsonFileParseOption as unknown as OptionComponentType<T>;
    case TranslationType.JsonString:
      return JsonStringParseOption as unknown as OptionComponentType<T>;
    case TranslationType.Text:
      return TextParseOption as unknown as OptionComponentType<T>;
    case TranslationType.CsvFile:
      return CsvFileParseOption as unknown as OptionComponentType<T>;
    default:
      throw new Error('Invalid translation type');
  }
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
    return [] as unknown as string[];
  } else {
    return '' as unknown as string;
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
    return (input) => (input as string[])?.length > 0;
  } else if (translationType === TranslationType.JsonString) {
    return (input) => {
      try {
        JSON.parse((input as string).trim());
        return true;
      } catch (e) {
        return false;
      }
    };
  } else {
    return (input) => (input as string)?.trim().length > 0;
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
  return [
    {
      value: TranslationType.JsonFile,
      label: getTranslationTypeLabel(TranslationType.JsonFile),
    },
    {
      value: TranslationType.JsonString,
      label: getTranslationTypeLabel(TranslationType.JsonString),
    },
    {
      value: TranslationType.Text,
      label: getTranslationTypeLabel(TranslationType.Text),
    },
    {
      value: TranslationType.CsvFile,
      label: getTranslationTypeLabel(TranslationType.CsvFile),
    },
  ];
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
