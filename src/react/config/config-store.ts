import { AiProvider, getDefaultModelConfig } from '../../ai/model';
import { TranslatorConfig, TranslatorConfigUpdate } from '../../types/config';
import { Language } from '../../utils/language';

const STORAGE_KEY = 'translator_config';

// 이벤트 타입 정의
type ConfigEvents = {
  configChanged: TranslatorConfig;
  configError: { message: string };
};

export class ConfigStore {
  private static instance: ConfigStore | null = null;
  private config: TranslatorConfig;
  private eventTarget: EventTarget;

  private constructor() {
    this.eventTarget = new EventTarget();
    this.config = this.loadConfig();
  }

  private loadConfig(): TranslatorConfig {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig) as TranslatorConfig;

        // 저장된 설정의 유효성 검사
        if (this.isValidConfig(parsedConfig)) {
          return parsedConfig;
        } else {
          console.warn('저장된 설정이 유효하지 않습니다. 기본 설정을 사용합니다.');
        }
      }
    } catch (error) {
      console.error('설정 로드 중 오류가 발생했습니다:', error);
    }

    // 기본 설정 반환
    return this.getDefaultConfig();
  }

  private isValidConfig(config: unknown): boolean {
    if (!config || typeof config !== 'object' || config === null) {
      return false;
    }

    const typedConfig = config as Record<string, unknown>;

    if (
      typeof typedConfig.sourceLanguage !== 'string' ||
      typeof typedConfig.isCustomInputMode !== 'boolean' ||
      !Object.values(AiProvider).includes(typedConfig.aiProvider as AiProvider) ||
      typeof typedConfig.useThinking !== 'boolean' ||
      typeof typedConfig.thinkingBudget !== 'number'
    ) {
      return false;
    }

    if (
      !typedConfig.customModelConfig ||
      typeof typedConfig.customModelConfig !== 'object' ||
      typedConfig.customModelConfig === null
    ) {
      return false;
    }

    const modelConfig = typedConfig.customModelConfig as Record<string, unknown>;

    return (
      typeof modelConfig.modelName === 'string' &&
      typeof modelConfig.requestsPerMinute === 'number' &&
      typeof modelConfig.maxOutputTokenCount === 'number'
    );
  }

  private getDefaultConfig(): TranslatorConfig {
    return {
      aiProvider: AiProvider.GOOGLE,
      sourceLanguage: Language.ENGLISH,
      customModelConfig: getDefaultModelConfig(),
      apiKey: '',
      isCustomInputMode: false,
      lastPresetName: 'default',
      useThinking: false,
      thinkingBudget: 2000,
    };
  }

  private saveConfig(config: TranslatorConfig): void {
    try {
      // 설정 저장 전 유효성 검사
      if (!this.isValidConfig(config)) {
        throw new Error('저장하려는 설정이 유효하지 않습니다.');
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      console.log('설정이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 중 오류가 발생했습니다:', error);
      // 저장 실패 시 사용자에게 알림
      this.dispatchEvent('configError', {
        message: '설정 저장에 실패했습니다. 다시 시도해주세요.',
      });
    }
  }

  public static getInstance(): ConfigStore {
    if (!ConfigStore.instance) {
      ConfigStore.instance = new ConfigStore();
    }
    return ConfigStore.instance;
  }

  public getConfig(): TranslatorConfig {
    return { ...this.config };
  }

  public updateConfig(update: TranslatorConfigUpdate): void {
    try {
      const newConfig = {
        ...this.config,
        ...update,
      };

      // 업데이트된 설정의 유효성 검사
      if (!this.isValidConfig(newConfig)) {
        throw new Error('업데이트된 설정이 유효하지 않습니다.');
      }

      this.config = newConfig;
      this.saveConfig(newConfig);

      // 설정 변경 이벤트 발생
      this.dispatchEvent('configChanged', this.getConfig());
    } catch (error) {
      console.error('설정 업데이트 중 오류가 발생했습니다:', error);
      this.dispatchEvent('configError', {
        message: '설정 업데이트에 실패했습니다. 다시 시도해주세요.',
      });
    }
  }

  // 제네릭 이벤트 발송 메서드
  private dispatchEvent<K extends keyof ConfigEvents>(type: K, detail: ConfigEvents[K]): void {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  // 제네릭 이벤트 리스너 추가 메서드
  public addEventListener<K extends keyof ConfigEvents>(
    type: K,
    listener: (event: CustomEvent<ConfigEvents[K]>) => void
  ): void {
    this.eventTarget.addEventListener(type, listener as EventListener);
  }

  // 제네릭 이벤트 리스너 제거 메서드
  public removeEventListener<K extends keyof ConfigEvents>(
    type: K,
    listener: (event: CustomEvent<ConfigEvents[K]>) => void
  ): void {
    this.eventTarget.removeEventListener(type, listener as EventListener);
  }
}
