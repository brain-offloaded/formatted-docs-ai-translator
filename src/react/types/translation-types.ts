import React from 'react';
import { TranslationType } from '../contexts/TranslationContext';
import { BaseParseOptionsDto } from '@/nest/parser/dto/base-parse-options.dto';
import { JsonParserOptionsDto } from '@/nest/parser/dto/options/json-parser-options.dto';
import { PlainTextParserOptionsDto } from '@/nest/parser/dto/options/plain-text-parser-options.dto';
import { CsvParserOptionsDto } from '@/nest/parser/dto/options/csv-parser-options.dto';
import { CustomTranslatorProps } from '../components/translators/BaseTranslator';

/**
 * 컴포넌트에서 사용할 파서 옵션 타입
 */
export type ParserOptionType = BaseParseOptionsDto;

/**
 * 기본 파서 옵션 Props 타입 - BaseParseOptions.tsx 내부로 이동
 */
// export interface BaseParseOptionsProps<T extends BaseParseOptionsDto = BaseParseOptionsDto> { ... }

/**
 * 공통 옵션 컴포넌트 Props 타입 정의 (제네릭 제거)
 */
export interface CustomOptionComponentProps {
  isTranslating: boolean;
  onOptionsChange?: (options: BaseParseOptionsDto) => void;
  initialOptions?: BaseParseOptionsDto;
  translationType?: TranslationType;
  // optionItems는 ParseOptionsFactory에서 주입되므로 여기서는 선택사항이 아님
  // optionItems?: OptionItem[];
  label?: string;
  showSettings?: boolean;
  onToggleSettings?: () => void;
}

/**
 * 옵션 필드 설정 타입
 */
export type OptionFieldConfig<T> = {
  key: keyof T;
  label?: string;
  helperText?: string;
  type?: 'text' | 'switch' | 'select';
  options?: { value: string; label: string }[];
};

/**
 * 각 TranslationType에 대한 옵션 타입 매핑
 */
export interface TranslationTypeToOptionsMap {
  [TranslationType.Json]: JsonParserOptionsDto;
  [TranslationType.Text]: PlainTextParserOptionsDto;
  [TranslationType.Csv]: CsvParserOptionsDto;
}

// 옵션 컴포넌트 타입 (제네릭 제거)
export type OptionComponentType<T extends TranslationType> =
  React.ComponentType<CustomOptionComponentProps>;

// 번역기 컴포넌트 타입
export type TranslatorComponentType<T extends TranslationType> = React.ComponentType<
  CustomTranslatorProps<TranslationTypeToOptionsMap[T]>
>;

// 특정 TranslationType에 해당하는 번역기와 옵션 컴포넌트 타입
export interface TranslatorWithOptions<T extends TranslationType> {
  TranslatorComponent: TranslatorComponentType<T>;
  OptionComponent: OptionComponentType<T>;
}
