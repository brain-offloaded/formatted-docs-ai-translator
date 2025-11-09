import React, { memo } from 'react';
import {
  BaseTranslator,
  BaseTranslatorOptions,
  BaseTranslatorProps,
} from '../components/translators/BaseTranslator';
import { translationConfigs } from '../config/translation-configs';
import { TranslationType } from '../contexts/TranslationContext';
import { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';

// promptPresetContent prop을 포함하도록 TranslatorComponentType 재정의
type TranslatorComponentType = React.MemoExoticComponent<
  (props: BaseTranslatorProps<BaseParseOptionsDto>) => React.ReactElement
>;

/**
 * 번역기 설정 인터페이스 - 번역기 생성에 필요한 모든 설정을 포함
 */
export interface TranslatorConfig {
  // 기본 번역기 옵션
  options: BaseTranslatorOptions;
  translationType: TranslationType;
  // 출력 포맷 함수 (선택 사항)
  formatOutput?: (output: string, isFileMode: boolean) => string;
}

const translatorConfigRegistry: Map<TranslationType, TranslatorConfig> = new Map(
  translationConfigs.map((config) => {
    const translationType = config.type as TranslationType;
    const translatorConfig: TranslatorConfig = {
      options: {
        inputLabel: config.translator.inputLabel,
        inputPlaceholder: config.translator.inputPlaceholder,
        translationType,
        inputFieldRows: config.translator.inputFieldRows,
        fileExtension: config.translator.fileExtension,
        fileLabel: config.translator.fileLabel,
      },
      translationType,
      formatOutput: config.translator.formatOutput,
    };
    return [translationType, translatorConfig];
  })
);

const componentCache: Map<TranslationType, TranslatorComponentType> = new Map();

const resolveTranslatorConfig = (type: TranslationType): TranslatorConfig => {
  const config = translatorConfigRegistry.get(type);
  if (!config) {
    throw new Error(`번역기 설정을 찾을 수 없습니다: ${type}`);
  }
  return config;
};

const createMemoizedTranslator = (type: TranslationType) => {
  const config = resolveTranslatorConfig(type);

  const TranslatorComponent = memo(
    (props: { parserOptions?: BaseParseOptionsDto | null; promptPresetContent?: string }) => {
      return (
        <BaseTranslator
          options={config.options}
          translationType={type}
          formatOutput={config.formatOutput}
          parserOptions={props.parserOptions}
          promptPresetContent={props.promptPresetContent}
        />
      );
    }
  );

  TranslatorComponent.displayName = `${type}Translator`;

  return TranslatorComponent;
};

/**
 * 번역기 팩토리 - 번역 타입에 따라 번역기 컴포넌트를 생성
 */
export class TranslatorFactory {
  /**
   * 번역기 컴포넌트 생성
   * @param type 번역 타입
   * @returns 번역기 컴포넌트
   */
  public static createTranslator(type: TranslationType): TranslatorComponentType {
    const cachedComponent = componentCache.get(type);
    if (cachedComponent) {
      return cachedComponent;
    }

    const component = createMemoizedTranslator(type);
    componentCache.set(type, component);
    return component;
  }

  /**
   * 번역기 설정 조회
   * @param type 번역 타입
   */
  public static getConfig(type: TranslationType): TranslatorConfig | undefined {
    return translatorConfigRegistry.get(type);
  }
}
