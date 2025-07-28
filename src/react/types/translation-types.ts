import React from 'react';
import { TranslationType } from '../contexts/TranslationContext';
import { BaseParseOptionsDto } from '@/nest/parser/dto/options/base-parse-options.dto';
import { OptionItem } from '../components/options/DynamicOptions';
import { BaseTranslatorProps } from '../components/translators/BaseTranslator';

/**
 * 컴포넌트에서 사용할 파서 옵션 타입
 */
export type ParserOptionType = BaseParseOptionsDto;

/**
 * 기본 파서 옵션 Props 타입
 */
export interface BaseParseOptionsProps<T extends BaseParseOptionsDto = BaseParseOptionsDto> {
  isTranslating: boolean;
  onOptionsChange?: (options: T) => void;
  initialOptions?: T;
  translationType?: TranslationType;
  optionItems?: OptionItem[]; // 동적 옵션 항목 배열
  // UI 관련 속성 추가
  label?: string;
  // 설정 패널 표시 여부 상태 (상태 끌어올리기)
  showSettings?: boolean;
  onToggleSettings?: () => void;
}

/**
 * 공통 옵션 컴포넌트 Props 타입 정의
 */
export type CustomOptionComponentProps<T extends BaseParseOptionsDto = BaseParseOptionsDto> =
  BaseParseOptionsProps<T>;

// 옵션 컴포넌트 타입
export type OptionComponentType = React.ComponentType<CustomOptionComponentProps<any>>;

// 번역기 컴포넌트 타입
export type TranslatorComponentType = React.ComponentType<BaseTranslatorProps<any>>;

// 특정 TranslationType에 해당하는 번역기와 옵션 컴포넌트 타입
export interface TranslatorWithOptions {
  TranslatorComponent: TranslatorComponentType;
  OptionComponent: OptionComponentType;
}
