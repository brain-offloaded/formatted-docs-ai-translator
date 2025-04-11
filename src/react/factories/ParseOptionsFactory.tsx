import React from 'react';
import { BaseParseOptions } from '../components/options/BaseParseOptions';
import { TranslationType } from '../contexts/TranslationContext';
import { OptionItem } from '../components/options/DynamicOptions';
import {
  OptionComponentType,
  TranslationTypeToOptionsMap,
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

/**
 * 파싱 옵션 레지스트리 - TranslationType별로 옵션 설정을 관리
 */
export class ParseOptionsRegistry {
  private static instance: ParseOptionsRegistry;
  private registry: Map<TranslationType, ParseOptionsConfig> = new Map();

  private constructor() {}

  public static getInstance(): ParseOptionsRegistry {
    if (!ParseOptionsRegistry.instance) {
      ParseOptionsRegistry.instance = new ParseOptionsRegistry();
    }
    return ParseOptionsRegistry.instance;
  }

  /**
   * 파싱 옵션 설정 등록
   * @param type 번역 타입
   * @param config 파싱 옵션 설정
   */
  public register(type: TranslationType, config: ParseOptionsConfig): void {
    this.registry.set(type, config);
  }

  /**
   * 파싱 옵션 설정 조회
   * @param type 번역 타입
   * @returns 파싱 옵션 설정
   */
  public getConfig(type: TranslationType): ParseOptionsConfig | undefined {
    return this.registry.get(type);
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
 * 파싱 옵션 팩토리 - 번역 타입에 따라 파싱 옵션 컴포넌트를 생성
 */
export class ParseOptionsFactory {
  private static registry = ParseOptionsRegistry.getInstance();

  /**
   * 파싱 옵션 컴포넌트 생성
   * @param type 번역 타입
   * @returns 파싱 옵션 컴포넌트
   */
  public static createParseOptions<T extends TranslationType>(type: T): OptionComponentType<T> {
    const config = this.registry.getConfig(type);
    if (!config) {
      throw new Error(`파싱 옵션 설정을 찾을 수 없습니다: ${type}`);
    }

    // 파싱 옵션 컴포넌트 생성 함수
    const OptionComponent = (props: CustomOptionComponentProps) => {
      // props에 추가 속성을 병합
      const combinedProps: any = {
        ...props,
        translationType: type,
        label: config.label,
        optionItems: config.optionItems,
      };

      // JSX 사용하여 컴포넌트 생성
      return <BaseParseOptions {...combinedProps} />;
    };

    return OptionComponent;
  }

  /**
   * 파싱 옵션 설정 등록
   * @param type 번역 타입
   * @param config 파싱 옵션 설정
   */
  public static registerParseOptions(type: TranslationType, config: ParseOptionsConfig): void {
    this.registry.register(type, config);
  }
}
