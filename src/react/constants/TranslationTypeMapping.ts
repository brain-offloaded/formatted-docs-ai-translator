import React from 'react';
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

/**
 * TranslationType에 따라 적절한 컴포넌트를 반환하는 함수
 * @param type 번역 유형
 * @returns 해당 번역 유형에 맞는 React 컴포넌트
 */
export const getTranslatorComponent = (type: TranslationType): React.ComponentType => {
  switch (type) {
    case TranslationType.JsonFile:
      return JsonFileTranslator;
    case TranslationType.JsonString:
      return JsonStringTranslator;
    case TranslationType.Text:
      return TextTranslator;
    case TranslationType.CsvFile:
      return CsvFileTranslator;
    default:
      throw new Error('Invalid translation type');
  }
};

/**
 * TranslationType에 따라 적절한 옵션 컴포넌트를 반환하는 함수
 * @param type 번역 유형
 * @returns 해당 번역 유형에 맞는 옵션 컴포넌트
 */
export const getParserOptionComponent = (
  type: TranslationType
): React.ComponentType<{
  isTranslating: boolean;
  onOptionsChange?: (options: BaseParseOptionsDto) => void;
}> => {
  switch (type) {
    case TranslationType.JsonFile:
      return JsonFileParseOption;
    case TranslationType.JsonString:
      return JsonStringParseOption;
    case TranslationType.Text:
      return TextParseOption;
    case TranslationType.CsvFile:
      return CsvFileParseOption;
    default:
      throw new Error('Invalid translation type');
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
