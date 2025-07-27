import React, { memo } from 'react';
import {
  BaseTranslator,
  BaseTranslatorOptions,
  BaseTranslatorProps,
} from '../components/translators/BaseTranslator'; // BaseTranslatorProps import
import { TranslationType } from '../contexts/TranslationContext';
import { IpcChannel } from '@/nest/common/ipc.channel';
import {
  TranslationTypeToOptionsMap,
  // TranslatorComponentType as OriginalTranslatorComponentType,
} from '../types/translation-types'; // 이름 변경
import { OptionItem } from '../components/options/DynamicOptions';

// promptPresetContent prop을 포함하도록 TranslatorComponentType 재정의
type TranslatorComponentType<T extends TranslationType> = React.MemoExoticComponent<
  (props: BaseTranslatorProps<TranslationTypeToOptionsMap[T]>) => React.ReactElement
>;

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
  formatOutput?: (output: string, isFileMode: boolean) => string;
  // 기본 옵션 아이템 (선택 사항)
  optionItems?: OptionItem[];
}

/**
 * 번역기 레지스트리 - TranslationType별로 번역기 설정을 관리
 */
export class TranslatorRegistry {
  private static instance: TranslatorRegistry;
  private registry: Map<TranslationType, TranslatorConfig> = new Map();
  // 캐시된 번역기 컴포넌트 저장
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private componentCache: Map<TranslationType, TranslatorComponentType<any>> = new Map();

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
    // 등록 시 캐시 초기화
    this.componentCache.delete(type);
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

  /**
   * 캐시된 번역기 컴포넌트 가져오기 또는 생성
   * @param type 번역 타입
   * @returns 번역기 컴포넌트
   */
  public getOrCreateComponent<T extends TranslationType>(type: T): TranslatorComponentType<T> {
    // 캐시에서 확인
    const cachedComponent = this.componentCache.get(type) as TranslatorComponentType<T>;
    if (cachedComponent) {
      return cachedComponent;
    }

    // 없으면 생성
    const config = this.getConfig(type);
    if (!config) {
      throw new Error(`번역기 설정을 찾을 수 없습니다: ${type}`);
    }

    // 메모이제이션된 번역기 컴포넌트 생성
    const TranslatorComponent = memo(
      (props: {
        parserOptions?: TranslationTypeToOptionsMap[T] | null;
        promptPresetContent?: string; // promptPresetContent prop 추가
      }) => {
        return (
          <BaseTranslator
            options={config.options}
            parseChannel={config.parseChannel}
            translateChannel={config.translateChannel || IpcChannel.TranslateTextArray}
            applyChannel={config.applyChannel}
            formatOutput={config.formatOutput}
            parserOptions={props.parserOptions as TranslationTypeToOptionsMap[T]}
            promptPresetContent={props.promptPresetContent} // promptPresetContent prop 전달
          />
        );
      }
    );

    // displayName 속성 추가
    TranslatorComponent.displayName = `${type}Translator`;

    // 캐시에 저장
    this.componentCache.set(type, TranslatorComponent);

    return TranslatorComponent;
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
    // 반환 타입 명시
    return this.registry.getOrCreateComponent(type);
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
