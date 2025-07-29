import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AiProvider, getDefaultModelConfig } from '../../ai/model';
import { TranslatorConfig, TranslatorConfigUpdate } from '../../types/config';
import { Language } from '../../utils/language';

// Zustand 상태 및 액션 타입 정의
export interface ConfigState extends TranslatorConfig {
  updateConfig: (update: TranslatorConfigUpdate) => void;
  resetConfig: () => void;
}

// 기본 설정 값
const getDefaultConfig = (): TranslatorConfig => ({
  aiProvider: AiProvider.GOOGLE,
  sourceLanguage: Language.ENGLISH,
  customModelConfig: getDefaultModelConfig(),
  apiKey: '',
  isCustomInputMode: false,
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
      // apiKey를 제외한 나머지 상태만 저장
      partialize: (state) =>
        Object.fromEntries(Object.entries(state).filter(([key]) => !['apiKey'].includes(key))),
    }
  )
);
