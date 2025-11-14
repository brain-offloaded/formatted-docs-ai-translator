import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getDefaultModelConfig } from '@/react/config/default-model-config';
import {
  AiTranslatorConfig,
  ProviderSpecificConfig,
  TranslatorConfigUpdate,
} from '@/react/types/config';
import { TranslatorAiSettingsDto } from '@/react/api/generated/models/TranslatorAiSettingsDto';
import { DEFAULT_CACHE_TAG } from '@apps/common/dist/constants/cache';
import { defaultSourceLanguage, defaultTargetLanguage } from '@apps/common/dist/language';

const createStorage = (): Storage => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  const store = new Map<string, string>();

  const memoryStorage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      const keys = Array.from(store.keys());
      return keys[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };

  return memoryStorage as Storage;
};

// Zustand 상태 및 액션 타입 정의
export interface ConfigState extends AiTranslatorConfig {
  updateConfig: (update: TranslatorConfigUpdate) => void;
  resetConfig: () => void;
}

// provider 별 기본 설정
const ModelProvider = TranslatorAiSettingsDto.modelProvider;
type ModelProvider = TranslatorAiSettingsDto['modelProvider'];

const getDefaultProviderSettings = (): Record<ModelProvider, ProviderSpecificConfig> => ({
  [ModelProvider.GOOGLE]: {
    apiKey: '',
    customModelConfig: getDefaultModelConfig(),
    useThinking: false,
    thinkingBudget: 2000,
    setThinkingBudget: false,
  },
  [ModelProvider.VERTEX_AI]: {
    apiKey: '',
    customModelConfig: getDefaultModelConfig(),
    useThinking: false,
    thinkingBudget: 2000,
    setThinkingBudget: false,
  },
});

// 기본 설정 값 (현재 provider 값은 providerSettings에서 가져와 미러링)
const getDefaultConfig = (): AiTranslatorConfig => {
  const providerSettings = getDefaultProviderSettings();
  const initialProvider = ModelProvider.GOOGLE;
  return {
    modelProvider: initialProvider,
    sourceLanguage: defaultSourceLanguage,
    targetLanguage: defaultTargetLanguage,
    customModelConfig: providerSettings[initialProvider].customModelConfig,
    apiKey: providerSettings[initialProvider].apiKey,
    cacheTag: DEFAULT_CACHE_TAG,
    beginnerModeEnabled: true,
    lastPresetName: 'default',
    lastPromptPresetName: '', // 호환성 유지
    lastTextPromptPresetName: '',
    lastImagePromptPresetName: '',
    useThinking: providerSettings[initialProvider].useThinking,
    thinkingBudget: providerSettings[initialProvider].thinkingBudget,
    setThinkingBudget: providerSettings[initialProvider].setThinkingBudget,
    providerSettings,
  };
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      ...getDefaultConfig(),

      // 설정 업데이트 액션
      updateConfig: (update) => {
        set((state) => {
          let newState: AiTranslatorConfig = { ...state, ...update };

          // providerSettings 내부 값 동기화 로직
          // 1) modelProvider 변경 시: 해당 provider 저장된 값으로 상위 필드 미러링
          if (update.modelProvider && update.modelProvider !== state.modelProvider) {
            const p = update.modelProvider;
            const pConf = state.providerSettings[p] || {
              apiKey: '',
              customModelConfig: getDefaultModelConfig(),
              useThinking: false,
              thinkingBudget: 2000,
              setThinkingBudget: false,
            };
            newState = {
              ...newState,
              apiKey: pConf.apiKey,
              customModelConfig: pConf.customModelConfig,
              useThinking: pConf.useThinking,
              thinkingBudget: pConf.thinkingBudget,
              setThinkingBudget: pConf.setThinkingBudget,
              providerSettings: {
                ...state.providerSettings,
                [p]: pConf,
              },
            };
          }

          // 2) apiKey / customModelConfig / useThinking / thinkingBudget / setThinkingBudget 변경 시 현재 provider 설정에 반영
          const currentProvider = newState.modelProvider;
          const currentProviderSettings = newState.providerSettings[currentProvider];
          const providerPatched: ProviderSpecificConfig = {
            ...currentProviderSettings,
            apiKey: update.apiKey !== undefined ? update.apiKey : currentProviderSettings.apiKey,
            customModelConfig:
              update.customModelConfig !== undefined
                ? update.customModelConfig
                : currentProviderSettings.customModelConfig,
            useThinking:
              update.useThinking !== undefined
                ? update.useThinking
                : currentProviderSettings.useThinking,
            thinkingBudget:
              update.thinkingBudget !== undefined
                ? update.thinkingBudget
                : currentProviderSettings.thinkingBudget,
            setThinkingBudget:
              update.setThinkingBudget !== undefined
                ? update.setThinkingBudget
                : currentProviderSettings.setThinkingBudget,
          };

          newState.providerSettings = {
            ...newState.providerSettings,
            [currentProvider]: providerPatched,
          };

          return newState;
        });
      },

      // 설정 초기화 액션
      resetConfig: () => {
        set(getDefaultConfig());
      },
    }),
    {
      name: 'translator_config', // localStorage 키
      storage: createJSONStorage(createStorage),
    }
  )
);
