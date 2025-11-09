import React, { memo } from 'react';
import { BaseParseOptions } from '../components/options/BaseParseOptions';
import { translationConfigs } from '../config/translation-configs';
import { TranslationType } from '../contexts/TranslationContext';
import { OptionItem } from '../components/options/DynamicOptions';
import { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';
import {
  OptionComponentType,
  BaseParseOptionsProps,
  CustomOptionComponentProps,
} from '../types/translation-types';

/**
 * 파싱 옵션 설정 인터페이스 - 옵션 컴포넌트 생성에 필요한 모든 설정을 포함
 */
export interface ParseOptionsConfig {
  // 옵션 컴포넌트 레이블
  label: string;
  // 옵션 아이템 목록 (선택 사항)
  optionItems?: OptionItem[];
}

const parseOptionsConfigRegistry: Map<TranslationType, ParseOptionsConfig> = new Map(
  translationConfigs.map((config) => {
    const translationType = config.type as TranslationType;
    const parseOptionsConfig: ParseOptionsConfig = {
      label: config.parser.options.label,
      optionItems: config.parser.options.optionItems,
    };
    return [translationType, parseOptionsConfig];
  })
);

// 캐시된 옵션 컴포넌트 저장
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const componentCache: Map<TranslationType, OptionComponentType<any>> = new Map();

const resolveParseOptionsConfig = (type: TranslationType): ParseOptionsConfig => {
  const config = parseOptionsConfigRegistry.get(type);
  if (!config) {
    throw new Error(`파싱 옵션 설정을 찾을 수 없습니다: ${type}`);
  }
  return config;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMemoizedParseOptions = (type: TranslationType): OptionComponentType<any> => {
  const config = resolveParseOptionsConfig(type);

  const OptionComponent = memo((props: CustomOptionComponentProps<BaseParseOptionsDto>) => {
    const combinedProps: BaseParseOptionsProps<BaseParseOptionsDto> = {
      ...props,
      translationType: type,
      label: config.label,
      optionItems: config.optionItems,
    };

    return <BaseParseOptions {...combinedProps} />;
  });

  OptionComponent.displayName = `${type}ParseOptions`;

  return OptionComponent;
};

/**
 * 파싱 옵션 팩토리 - 번역 타입에 따라 파싱 옵션 컴포넌트를 생성
 */
export class ParseOptionsFactory {
  /**
   * 파싱 옵션 컴포넌트 생성
   * @param type 번역 타입
   * @returns 파싱 옵션 컴포넌트
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static createParseOptions(type: TranslationType): OptionComponentType<any> {
    const cachedComponent = componentCache.get(type);
    if (cachedComponent) {
      return cachedComponent;
    }

    const component = createMemoizedParseOptions(type);
    componentCache.set(type, component);
    return component;
  }

  /**
   * 파싱 옵션 설정 조회
   * @param type 번역 타입
   */
  public static getConfig(type: TranslationType): ParseOptionsConfig | undefined {
    return parseOptionsConfigRegistry.get(type);
  }
}
