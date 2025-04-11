import React, { memo } from 'react';
import { BaseParseOptions } from '../components/options/BaseParseOptions';
import { TranslationType } from '../contexts/TranslationContext';
import { OptionItem } from '../components/options/DynamicOptions';
import {
  OptionComponentType,
  TranslationTypeToOptionsMap,
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

/**
 * 파싱 옵션 레지스트리 - TranslationType별로 옵션 설정을 관리
 */
export class ParseOptionsRegistry {
  private static instance: ParseOptionsRegistry;
  private registry: Map<TranslationType, ParseOptionsConfig> = new Map();
  // 캐시된 옵션 컴포넌트 저장
  private componentCache: Map<TranslationType, OptionComponentType<any>> = new Map();

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
    // 등록 시 캐시 초기화
    this.componentCache.delete(type);
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

  /**
   * 캐시된 옵션 컴포넌트 가져오기 또는 생성
   * @param type 번역 타입
   * @returns 옵션 컴포넌트
   */
  public getOrCreateComponent<T extends TranslationType>(type: T): OptionComponentType<T> {
    // 캐시에서 확인
    const cachedComponent = this.componentCache.get(type) as OptionComponentType<T>;
    if (cachedComponent) {
      return cachedComponent;
    }

    // 없으면 생성
    const config = this.getConfig(type);
    if (!config) {
      throw new Error(`파싱 옵션 설정을 찾을 수 없습니다: ${type}`);
    }

    // 메모이제이션된 옵션 컴포넌트 생성
    const OptionComponent = memo(
      (props: CustomOptionComponentProps<TranslationTypeToOptionsMap[T]>) => {
        // props에 추가 속성을 병합
        const combinedProps: BaseParseOptionsProps<TranslationTypeToOptionsMap[T]> = {
          ...props,
          translationType: type,
          label: config.label,
          optionItems: config.optionItems,
        };

        // JSX 사용하여 컴포넌트 생성
        return <BaseParseOptions {...combinedProps} />;
      }
    );

    // 캐시에 저장
    this.componentCache.set(type, OptionComponent as OptionComponentType<any>);

    return OptionComponent as OptionComponentType<T>;
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
    return this.registry.getOrCreateComponent(type);
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
