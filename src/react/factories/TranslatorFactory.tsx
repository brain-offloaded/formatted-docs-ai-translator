import React from 'react';
import { BaseTranslator, BaseTranslatorOptions } from '../components/translators/BaseTranslator';
import { TranslationType } from '../contexts/TranslationContext';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { TranslationTypeToOptionsMap, TranslatorComponentType } from '../types/translation-types';
import { OptionItem } from '../components/options/DynamicOptions';

/**
 * 번역기 설정 인터페이스 - 번역기 생성에 필요한 모든 설정을 포함
 */
export interface TranslatorConfig {
  // 기본 번역기 옵션
  options: BaseTranslatorOptions;
  // IPC 채널 설정 - 파일 모드와 문자열 모드 통합
  parseChannel?: IpcChannel;
  translateChannel?: IpcChannel;
  applyChannel?: IpcChannel;
  // 출력 포맷 함수 (선택 사항)
  formatOutput?: (output: string, isFileInput: boolean) => string;
  // 기본 옵션 아이템 (선택 사항)
  optionItems?: OptionItem[];
}

/**
 * 번역기 레지스트리 - TranslationType별로 번역기 설정을 관리
 */
export class TranslatorRegistry {
  private static instance: TranslatorRegistry;
  private registry: Map<TranslationType, TranslatorConfig> = new Map();

  private constructor() {}

  public static getInstance(): TranslatorRegistry {
    if (!TranslatorRegistry.instance) {
      TranslatorRegistry.instance = new TranslatorRegistry();
    }
    return TranslatorRegistry.instance;
  }

  /**
   * 번역기 설정 등록
   * @param type 번역 타입
   * @param config 번역기 설정
   */
  public register(type: TranslationType, config: TranslatorConfig): void {
    this.registry.set(type, config);
  }

  /**
   * 번역기 설정 조회
   * @param type 번역 타입
   * @returns 번역기 설정
   */
  public getConfig(type: TranslationType): TranslatorConfig | undefined {
    return this.registry.get(type) as TranslatorConfig | undefined;
  }

  /**
   * 등록된 모든 번역기 타입 조회
   * @returns 번역기 타입 배열
   */
  public getAllTypes(): TranslationType[] {
    return Array.from(this.registry.keys());
  }
}

/**
 * 번역기 팩토리 - 번역 타입에 따라 번역기 컴포넌트를 생성
 */
export class TranslatorFactory {
  private static registry = TranslatorRegistry.getInstance();

  /**
   * 번역기 컴포넌트 생성
   * @param type 번역 타입
   * @returns 번역기 컴포넌트
   */
  public static createTranslator<T extends TranslationType>(type: T): TranslatorComponentType<T> {
    const config = this.registry.getConfig(type);
    if (!config) {
      throw new Error(`번역기 설정을 찾을 수 없습니다: ${type}`);
    }

    // 번역기 컴포넌트 생성 함수
    const TranslatorComponent: TranslatorComponentType<T> = ({ parserOptions }) => {
      return (
        <BaseTranslator
          options={config.options}
          parseChannel={config.parseChannel}
          translateChannel={config.translateChannel || IpcChannel.TranslateTextArray}
          applyChannel={config.applyChannel}
          formatOutput={config.formatOutput}
          parserOptions={parserOptions as TranslationTypeToOptionsMap[T]}
        />
      );
    };

    return TranslatorComponent;
  }

  /**
   * 번역기 설정 등록
   * @param type 번역 타입
   * @param config 번역기 설정
   */
  public static registerTranslator(type: TranslationType, config: TranslatorConfig): void {
    this.registry.register(type, config);
  }
}
