import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getDefaultModelConfig } from '../../ai/model';
import { TranslatorConfig, TranslatorConfigUpdate } from '../../types/config';
import { Language } from '../../utils/language';
import { ModelProvider } from '@/ai/provider';

// Zustand 상태 및 액션 타입 정의
export interface ConfigState extends TranslatorConfig {
  updateConfig: (update: TranslatorConfigUpdate) => void;
  resetConfig: () => void;
}

// 기본 설정 값
const getDefaultConfig = (): TranslatorConfig => ({
  modelProvider: ModelProvider.GOOGLE,
  sourceLanguage: Language.ENGLISH,
  customModelConfig: getDefaultModelConfig(),
  apiKey: '',
  lastPresetName: 'default',
  useThinking: false,
  thinkingBudget: 2000,
  setThinkingBudget: false,
});

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      ...getDefaultConfig(),

      // 설정 업데이트 액션
      updateConfig: (update) => {
        set((state) => ({
          ...state,
          ...update,
        }));
      },

      // 설정 초기화 액션
      resetConfig: () => {
        set(getDefaultConfig());
      },
    }),
    {
      name: 'translator_config', // localStorage 키
      storage: createJSONStorage(() => localStorage),
    }
  )
);
