import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getDefaultModelConfig } from '@/react/config/default-model-config';
import {
  AiTranslatorConfig,
  ProviderSpecificConfig,
  ProviderSlotConfig,
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
  addOpenAiCompatibleSlot: () => void;
  deleteOpenAiCompatibleSlot: (slotId?: string) => void;
  selectOpenAiCompatibleSlot: (slotId: string) => void;
  renameOpenAiCompatibleSlot: (slotId: string, name: string) => void;
}

// provider 별 기본 설정
const ModelProvider = TranslatorAiSettingsDto.modelProvider;
type ModelProvider = TranslatorAiSettingsDto['modelProvider'];

const createSlotId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `slot-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createSlot = ({
  id,
  name,
  baseUrl,
  apiKey,
  customModelConfig,
  useThinking,
  thinkingBudget,
  setThinkingBudget,
}: {
  id?: string;
  name?: string;
  baseUrl: string;
  apiKey: string;
  customModelConfig: ProviderSlotConfig['customModelConfig'];
  useThinking: boolean;
  thinkingBudget: number;
  setThinkingBudget: boolean;
}): ProviderSlotConfig => {
  return {
    id: id ?? createSlotId(),
    name: name ?? 'Slot 1',
    baseUrl,
    apiKey,
    customModelConfig,
    useThinking,
    thinkingBudget,
    setThinkingBudget,
  };
};

const normalizeOpenAiCompatibleSettings = (
  config: ProviderSpecificConfig
): { normalized: ProviderSpecificConfig; activeSlot: ProviderSlotConfig } => {
  const slots = Array.isArray(config.slots) ? (config.slots as ProviderSlotConfig[]) : [];
  if (slots.length === 0) {
    const slot = createSlot({
      id: config.activeSlotId ?? 'slot-1',
      name: 'Slot 1',
      baseUrl: config.baseUrl ?? '',
      apiKey: config.apiKey ?? '',
      customModelConfig: config.customModelConfig ?? getDefaultModelConfig(),
      useThinking: config.useThinking ?? false,
      thinkingBudget: config.thinkingBudget ?? 2000,
      setThinkingBudget: config.setThinkingBudget ?? false,
    });
    const normalized: ProviderSpecificConfig = {
      ...config,
      baseUrl: slot.baseUrl,
      apiKey: slot.apiKey,
      customModelConfig: slot.customModelConfig,
      useThinking: slot.useThinking,
      thinkingBudget: slot.thinkingBudget,
      setThinkingBudget: slot.setThinkingBudget,
      slots: [slot],
      activeSlotId: slot.id,
    };
    return { normalized, activeSlot: slot };
  }

  const activeSlotId =
    typeof config.activeSlotId === 'string' && slots.some((s) => s.id === config.activeSlotId)
      ? config.activeSlotId
      : slots[0].id;
  const activeSlot = slots.find((s) => s.id === activeSlotId) ?? slots[0];

  const normalizedSlots: ProviderSlotConfig[] = slots.map((slot, index) => ({
    id: slot.id,
    name: slot.name?.trim() ? slot.name : `Slot ${index + 1}`,
    baseUrl: slot.baseUrl ?? '',
    apiKey: slot.apiKey ?? '',
    customModelConfig: slot.customModelConfig ?? getDefaultModelConfig(),
    useThinking: !!slot.useThinking,
    thinkingBudget: typeof slot.thinkingBudget === 'number' ? slot.thinkingBudget : 2000,
    setThinkingBudget: !!slot.setThinkingBudget,
  }));

  const normalizedActiveSlot =
    normalizedSlots.find((s) => s.id === activeSlot.id) ?? normalizedSlots[0];

  const normalized: ProviderSpecificConfig = {
    ...config,
    baseUrl: normalizedActiveSlot.baseUrl,
    apiKey: normalizedActiveSlot.apiKey,
    customModelConfig: normalizedActiveSlot.customModelConfig,
    useThinking: normalizedActiveSlot.useThinking,
    thinkingBudget: normalizedActiveSlot.thinkingBudget,
    setThinkingBudget: normalizedActiveSlot.setThinkingBudget,
    slots: normalizedSlots,
    activeSlotId: normalizedActiveSlot.id,
  };

  return { normalized, activeSlot: normalizedActiveSlot };
};

const getDefaultProviderSettings = (): Record<ModelProvider, ProviderSpecificConfig> => ({
  [ModelProvider.GOOGLE]: {
    baseUrl: '',
    apiKey: '',
    customModelConfig: getDefaultModelConfig(),
    useThinking: false,
    thinkingBudget: 2000,
    setThinkingBudget: false,
  },
  [ModelProvider.VERTEX_AI]: {
    baseUrl: '',
    apiKey: '',
    customModelConfig: getDefaultModelConfig(),
    useThinking: false,
    thinkingBudget: 2000,
    setThinkingBudget: false,
  },
  [ModelProvider.OPENAI_COMPATIBLE]: {
    baseUrl: '',
    apiKey: '',
    customModelConfig: getDefaultModelConfig(),
    useThinking: false,
    thinkingBudget: 2000,
    setThinkingBudget: false,
    slots: [
      createSlot({
        id: 'slot-1',
        name: 'Slot 1',
        baseUrl: '',
        apiKey: '',
        customModelConfig: getDefaultModelConfig(),
        useThinking: false,
        thinkingBudget: 2000,
        setThinkingBudget: false,
      }),
    ],
    activeSlotId: 'slot-1',
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
    baseUrl: providerSettings[initialProvider].baseUrl,
    cacheTag: DEFAULT_CACHE_TAG,
    beginnerModeEnabled: true,
    selectedModelPresetId: undefined,
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
          const openAiProvider = ModelProvider.OPENAI_COMPATIBLE;
          let newState: AiTranslatorConfig = { ...state, ...update };

          // providerSettings 내부 값 동기화 로직
          // 1) modelProvider 변경 시: 해당 provider 저장된 값으로 상위 필드 미러링
          if (update.modelProvider && update.modelProvider !== state.modelProvider) {
            const p = update.modelProvider;
            const pConf = state.providerSettings[p] || {
              baseUrl: '',
              apiKey: '',
              customModelConfig: getDefaultModelConfig(),
              useThinking: false,
              thinkingBudget: 2000,
              setThinkingBudget: false,
            };
            const normalizedProviderSettings =
              p === openAiProvider ? normalizeOpenAiCompatibleSettings(pConf).normalized : pConf;
            newState = {
              ...newState,
              apiKey: normalizedProviderSettings.apiKey,
              baseUrl: normalizedProviderSettings.baseUrl,
              customModelConfig: normalizedProviderSettings.customModelConfig,
              useThinking: normalizedProviderSettings.useThinking,
              thinkingBudget: normalizedProviderSettings.thinkingBudget,
              setThinkingBudget: normalizedProviderSettings.setThinkingBudget,
              providerSettings: {
                ...state.providerSettings,
                [p]: normalizedProviderSettings,
              },
            };
          }

          // 2) apiKey / customModelConfig / useThinking / thinkingBudget / setThinkingBudget 변경 시 현재 provider 설정에 반영
          const currentProvider = newState.modelProvider;
          const currentProviderSettingsRaw = newState.providerSettings[currentProvider] || {
            baseUrl: '',
            apiKey: '',
            customModelConfig: getDefaultModelConfig(),
            useThinking: false,
            thinkingBudget: 2000,
            setThinkingBudget: false,
          };
          const currentProviderSettings =
            currentProvider === openAiProvider
              ? normalizeOpenAiCompatibleSettings(currentProviderSettingsRaw).normalized
              : currentProviderSettingsRaw;
          const providerPatched: ProviderSpecificConfig = {
            ...currentProviderSettings,
            apiKey: update.apiKey !== undefined ? update.apiKey : currentProviderSettings.apiKey,
            baseUrl:
              update.baseUrl !== undefined ? update.baseUrl : currentProviderSettings.baseUrl,
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

          if (currentProvider === openAiProvider) {
            const slots = Array.isArray(providerPatched.slots)
              ? (providerPatched.slots as ProviderSlotConfig[])
              : [];
            const activeSlotId =
              typeof providerPatched.activeSlotId === 'string' ? providerPatched.activeSlotId : '';
            const safeActiveSlotId =
              slots.some((s) => s.id === activeSlotId) && activeSlotId
                ? activeSlotId
                : (slots[0]?.id ?? 'slot-1');

            const nextSlots =
              slots.length > 0
                ? slots.map((slot) =>
                    slot.id === safeActiveSlotId
                      ? {
                          ...slot,
                          apiKey: providerPatched.apiKey,
                          baseUrl: providerPatched.baseUrl,
                          customModelConfig: providerPatched.customModelConfig,
                          useThinking: providerPatched.useThinking,
                          thinkingBudget: providerPatched.thinkingBudget,
                          setThinkingBudget: providerPatched.setThinkingBudget,
                        }
                      : slot
                  )
                : [
                    createSlot({
                      id: safeActiveSlotId,
                      name: 'Slot 1',
                      apiKey: providerPatched.apiKey,
                      baseUrl: providerPatched.baseUrl,
                      customModelConfig: providerPatched.customModelConfig,
                      useThinking: providerPatched.useThinking,
                      thinkingBudget: providerPatched.thinkingBudget,
                      setThinkingBudget: providerPatched.setThinkingBudget,
                    }),
                  ];

            providerPatched.slots = nextSlots;
            providerPatched.activeSlotId = safeActiveSlotId;
          }

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

      selectOpenAiCompatibleSlot: (slotId) => {
        set((state) => {
          const openAiProvider = ModelProvider.OPENAI_COMPATIBLE;
          const openAiSettings = state.providerSettings[openAiProvider] || {
            baseUrl: '',
            apiKey: '',
            customModelConfig: getDefaultModelConfig(),
            useThinking: false,
            thinkingBudget: 2000,
            setThinkingBudget: false,
          };
          const { normalized } = normalizeOpenAiCompatibleSettings(openAiSettings);
          const slots = Array.isArray(normalized.slots) ? normalized.slots : [];
          const nextActive = slots.find((s) => s.id === slotId) ?? slots[0];
          if (!nextActive) return state;

          const nextProviderSettings: ProviderSpecificConfig = {
            ...normalized,
            activeSlotId: nextActive.id,
            baseUrl: nextActive.baseUrl,
            apiKey: nextActive.apiKey,
            customModelConfig: nextActive.customModelConfig,
            useThinking: nextActive.useThinking,
            thinkingBudget: nextActive.thinkingBudget,
            setThinkingBudget: nextActive.setThinkingBudget,
          };

          const shouldSyncTopLevel = state.modelProvider === openAiProvider;
          return {
            ...state,
            ...(shouldSyncTopLevel
              ? {
                  apiKey: nextActive.apiKey,
                  baseUrl: nextActive.baseUrl,
                  customModelConfig: nextActive.customModelConfig,
                  useThinking: nextActive.useThinking,
                  thinkingBudget: nextActive.thinkingBudget,
                  setThinkingBudget: nextActive.setThinkingBudget,
                }
              : {}),
            providerSettings: {
              ...state.providerSettings,
              [openAiProvider]: nextProviderSettings,
            },
          };
        });
      },

      addOpenAiCompatibleSlot: () => {
        set((state) => {
          const openAiProvider = ModelProvider.OPENAI_COMPATIBLE;
          const openAiSettings = state.providerSettings[openAiProvider] || {
            baseUrl: '',
            apiKey: '',
            customModelConfig: getDefaultModelConfig(),
            useThinking: false,
            thinkingBudget: 2000,
            setThinkingBudget: false,
          };
          const { normalized, activeSlot } = normalizeOpenAiCompatibleSettings(openAiSettings);
          const slots = Array.isArray(normalized.slots) ? normalized.slots : [];
          const nextSlotNumber = slots.length + 1;
          const newSlot = createSlot({
            name: `Slot ${nextSlotNumber}`,
            baseUrl: activeSlot.baseUrl,
            apiKey: activeSlot.apiKey,
            customModelConfig: activeSlot.customModelConfig,
            useThinking: activeSlot.useThinking,
            thinkingBudget: activeSlot.thinkingBudget,
            setThinkingBudget: activeSlot.setThinkingBudget,
          });

          const nextSlots = [...slots, newSlot];
          const nextProviderSettings: ProviderSpecificConfig = {
            ...normalized,
            slots: nextSlots,
            activeSlotId: newSlot.id,
            baseUrl: newSlot.baseUrl,
            apiKey: newSlot.apiKey,
            customModelConfig: newSlot.customModelConfig,
            useThinking: newSlot.useThinking,
            thinkingBudget: newSlot.thinkingBudget,
            setThinkingBudget: newSlot.setThinkingBudget,
          };

          const shouldSyncTopLevel = state.modelProvider === openAiProvider;
          return {
            ...state,
            ...(shouldSyncTopLevel
              ? {
                  apiKey: newSlot.apiKey,
                  baseUrl: newSlot.baseUrl,
                  customModelConfig: newSlot.customModelConfig,
                  useThinking: newSlot.useThinking,
                  thinkingBudget: newSlot.thinkingBudget,
                  setThinkingBudget: newSlot.setThinkingBudget,
                }
              : {}),
            providerSettings: {
              ...state.providerSettings,
              [openAiProvider]: nextProviderSettings,
            },
          };
        });
      },

      deleteOpenAiCompatibleSlot: (slotId) => {
        set((state) => {
          const openAiProvider = ModelProvider.OPENAI_COMPATIBLE;
          const openAiSettings = state.providerSettings[openAiProvider] || {
            baseUrl: '',
            apiKey: '',
            customModelConfig: getDefaultModelConfig(),
            useThinking: false,
            thinkingBudget: 2000,
            setThinkingBudget: false,
          };
          const { normalized } = normalizeOpenAiCompatibleSettings(openAiSettings);
          const slots = Array.isArray(normalized.slots) ? normalized.slots : [];
          if (slots.length <= 1) return state;

          const targetId = slotId ?? normalized.activeSlotId ?? slots[0].id;
          const nextSlots = slots.filter((s) => s.id !== targetId);
          const nextActive =
            nextSlots.find((s) => s.id === normalized.activeSlotId) ?? nextSlots[0];
          if (!nextActive) return state;

          const nextProviderSettings: ProviderSpecificConfig = {
            ...normalized,
            slots: nextSlots,
            activeSlotId: nextActive.id,
            baseUrl: nextActive.baseUrl,
            apiKey: nextActive.apiKey,
            customModelConfig: nextActive.customModelConfig,
            useThinking: nextActive.useThinking,
            thinkingBudget: nextActive.thinkingBudget,
            setThinkingBudget: nextActive.setThinkingBudget,
          };

          const shouldSyncTopLevel = state.modelProvider === openAiProvider;
          return {
            ...state,
            ...(shouldSyncTopLevel
              ? {
                  apiKey: nextActive.apiKey,
                  baseUrl: nextActive.baseUrl,
                  customModelConfig: nextActive.customModelConfig,
                  useThinking: nextActive.useThinking,
                  thinkingBudget: nextActive.thinkingBudget,
                  setThinkingBudget: nextActive.setThinkingBudget,
                }
              : {}),
            providerSettings: {
              ...state.providerSettings,
              [openAiProvider]: nextProviderSettings,
            },
          };
        });
      },

      renameOpenAiCompatibleSlot: (slotId, name) => {
        set((state) => {
          const openAiProvider = ModelProvider.OPENAI_COMPATIBLE;
          const openAiSettings = state.providerSettings[openAiProvider] || {
            baseUrl: '',
            apiKey: '',
            customModelConfig: getDefaultModelConfig(),
            useThinking: false,
            thinkingBudget: 2000,
            setThinkingBudget: false,
          };
          const { normalized } = normalizeOpenAiCompatibleSettings(openAiSettings);
          const slots = Array.isArray(normalized.slots) ? normalized.slots : [];
          if (slots.length === 0) return state;

          const nextSlots = slots.map((slot) => (slot.id === slotId ? { ...slot, name } : slot));

          return {
            ...state,
            providerSettings: {
              ...state.providerSettings,
              [openAiProvider]: {
                ...normalized,
                slots: nextSlots,
              },
            },
          };
        });
      },
    }),
    {
      name: 'translator_config', // localStorage 키
      storage: createJSONStorage(createStorage),
    }
  )
);
