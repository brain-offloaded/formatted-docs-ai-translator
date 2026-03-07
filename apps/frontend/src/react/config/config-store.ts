import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getDefaultModelConfig } from '@/react/config/default-model-config';
import {
  AiTranslatorConfig,
  ProviderSpecificConfig,
  ProviderSlotConfig,
  PlaceholderPreservationRuleConfig,
  TranslatorConfigUpdate,
} from '@/react/types/config';
import { TranslatorAiSettingsDto } from '@/react/api/generated/models/TranslatorAiSettingsDto';
import { DEFAULT_CACHE_TAG } from '@apps/common/dist/constants/cache';
import { defaultSourceLanguage, defaultTargetLanguage } from '@apps/common/dist/language';
import i18n from '@/react/config/i18n';

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

let slotIdCounter = 0;

const createSlotId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  slotIdCounter += 1;
  return `slot-${Date.now()}-${slotIdCounter}-${Math.random().toString(16).slice(2)}`;
};

const createSlot = ({
  id,
  name,
  baseUrl,
  apiKey,
  customModelConfig,
  useThinking,
  thinkingLevel,
  thinkingBudget,
  setThinkingBudget,
}: {
  id?: string;
  name?: string;
  baseUrl: string;
  apiKey: string;
  customModelConfig: ProviderSlotConfig['customModelConfig'];
  useThinking: boolean;
  thinkingLevel: string;
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
    thinkingLevel,
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
      customModelConfig: getDefaultModelConfig(config.customModelConfig),
      useThinking: config.useThinking ?? false,
      thinkingLevel: config.thinkingLevel ?? '',
      thinkingBudget: config.thinkingBudget ?? 2000,
      setThinkingBudget: config.setThinkingBudget ?? false,
    });
    const normalized: ProviderSpecificConfig = {
      ...config,
      baseUrl: slot.baseUrl,
      apiKey: slot.apiKey,
      customModelConfig: slot.customModelConfig,
      useThinking: slot.useThinking,
      thinkingLevel: slot.thinkingLevel,
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
    customModelConfig: getDefaultModelConfig(slot.customModelConfig),
    useThinking: !!slot.useThinking,
    thinkingLevel: typeof slot.thinkingLevel === 'string' ? slot.thinkingLevel : '',
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
    thinkingLevel: normalizedActiveSlot.thinkingLevel,
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
    thinkingLevel: '',
    thinkingBudget: 2000,
    setThinkingBudget: false,
  },
  [ModelProvider.VERTEX_AI]: {
    baseUrl: '',
    apiKey: '',
    customModelConfig: getDefaultModelConfig(),
    useThinking: false,
    thinkingLevel: '',
    thinkingBudget: 2000,
    setThinkingBudget: false,
  },
  [ModelProvider.OPENAI_COMPATIBLE]: {
    baseUrl: '',
    apiKey: '',
    customModelConfig: getDefaultModelConfig(),
    useThinking: false,
    thinkingLevel: '',
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
        thinkingLevel: '',
        thinkingBudget: 2000,
        setThinkingBudget: false,
      }),
    ],
    activeSlotId: 'slot-1',
  },
});

type PlaceholderRuleDescriptionKey =
  | 'settings.placeholderPreservation.ruleDescriptions.carriageReturn'
  | 'settings.placeholderPreservation.ruleDescriptions.lineFeed';

const getDefaultPlaceholderRuleDescription = (
  pattern: string,
  flags: string,
  translate: (key: PlaceholderRuleDescriptionKey) => string
): string => {
  const normalizedFlags = flags.replace(/[^dgimsuvy]/g, '');
  if (pattern === '\\r' && normalizedFlags.length === 0) {
    return translate('settings.placeholderPreservation.ruleDescriptions.carriageReturn');
  }
  if (pattern === '\\n' && normalizedFlags.length === 0) {
    return translate('settings.placeholderPreservation.ruleDescriptions.lineFeed');
  }
  return '';
};

export const createDefaultPlaceholderPreservationRules = (
  translate: (key: PlaceholderRuleDescriptionKey) => string = (key) => i18n.t(key)
): PlaceholderPreservationRuleConfig[] => [
  {
    pattern: '\\r',
    flags: '',
    enabled: true,
    description: getDefaultPlaceholderRuleDescription('\\r', '', translate),
  },
  {
    pattern: '\\n',
    flags: '',
    enabled: true,
    description: getDefaultPlaceholderRuleDescription('\\n', '', translate),
  },
];

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
    thinkingLevel: providerSettings[initialProvider].thinkingLevel,
    thinkingBudget: providerSettings[initialProvider].thinkingBudget,
    setThinkingBudget: providerSettings[initialProvider].setThinkingBudget,
    placeholderPreservationEnabled: true,
    placeholderPreservationRules: createDefaultPlaceholderPreservationRules(),
    providerSettings,
  };
};

const normalizePlaceholderPreservationRules = (
  rules: unknown,
  defaults: PlaceholderPreservationRuleConfig[]
): PlaceholderPreservationRuleConfig[] => {
  if (!Array.isArray(rules)) {
    return defaults;
  }

  const normalized = rules
    .map((rule) => {
      const candidate = rule as Partial<PlaceholderPreservationRuleConfig> | undefined;
      const pattern = typeof candidate?.pattern === 'string' ? candidate.pattern : '';
      const flags = typeof candidate?.flags === 'string' ? candidate.flags : '';
      const enabled = typeof candidate?.enabled === 'boolean' ? candidate.enabled : true;
      const description =
        typeof candidate?.description === 'string'
          ? candidate.description
          : getDefaultPlaceholderRuleDescription(pattern, flags, (key) => i18n.t(key));
      if (!pattern.trim()) return null;
      return { pattern, flags, enabled, description };
    })
    .filter((v): v is PlaceholderPreservationRuleConfig => !!v);

  return normalized.length > 0 ? normalized : defaults;
};

const normalizeProviderSettings = (config: unknown): ProviderSpecificConfig => {
  const candidate = config as Partial<ProviderSpecificConfig> | undefined;
  return {
    baseUrl: typeof candidate?.baseUrl === 'string' ? candidate.baseUrl : '',
    apiKey: typeof candidate?.apiKey === 'string' ? candidate.apiKey : '',
    customModelConfig: getDefaultModelConfig(candidate?.customModelConfig),
    useThinking: !!candidate?.useThinking,
    thinkingLevel: typeof candidate?.thinkingLevel === 'string' ? candidate.thinkingLevel : '',
    thinkingBudget: typeof candidate?.thinkingBudget === 'number' ? candidate.thinkingBudget : 2000,
    setThinkingBudget: !!candidate?.setThinkingBudget,
    slots: Array.isArray(candidate?.slots) ? candidate?.slots : undefined,
    activeSlotId: typeof candidate?.activeSlotId === 'string' ? candidate.activeSlotId : undefined,
  };
};

const normalizeRehydratedConfig = (persistedState: unknown): AiTranslatorConfig => {
  const defaults = getDefaultConfig();
  const persisted = (persistedState ?? {}) as Partial<AiTranslatorConfig>;

  const rawProviderSettings =
    persisted.providerSettings && typeof persisted.providerSettings === 'object'
      ? (persisted.providerSettings as Record<string, unknown>)
      : {};

  const openAiProvider = ModelProvider.OPENAI_COMPATIBLE;
  const normalizedProviderSettings: Record<ModelProvider, ProviderSpecificConfig> = {
    [ModelProvider.GOOGLE]: normalizeProviderSettings(rawProviderSettings[ModelProvider.GOOGLE]),
    [ModelProvider.VERTEX_AI]: normalizeProviderSettings(
      rawProviderSettings[ModelProvider.VERTEX_AI]
    ),
    [openAiProvider]: normalizeOpenAiCompatibleSettings(
      normalizeProviderSettings(rawProviderSettings[openAiProvider])
    ).normalized,
  };

  const providerCandidates = Object.values(ModelProvider) as string[];
  const modelProvider =
    typeof persisted.modelProvider === 'string' &&
    providerCandidates.includes(persisted.modelProvider)
      ? (persisted.modelProvider as ModelProvider)
      : defaults.modelProvider;

  const activeProviderSettings = normalizedProviderSettings[modelProvider];

  return {
    ...defaults,
    ...persisted,
    modelProvider,
    providerSettings: normalizedProviderSettings,
    apiKey: activeProviderSettings.apiKey,
    baseUrl: activeProviderSettings.baseUrl,
    customModelConfig: activeProviderSettings.customModelConfig,
    useThinking: activeProviderSettings.useThinking,
    thinkingLevel: activeProviderSettings.thinkingLevel,
    thinkingBudget: activeProviderSettings.thinkingBudget,
    setThinkingBudget: activeProviderSettings.setThinkingBudget,
    placeholderPreservationEnabled:
      typeof persisted.placeholderPreservationEnabled === 'boolean'
        ? persisted.placeholderPreservationEnabled
        : defaults.placeholderPreservationEnabled,
    placeholderPreservationRules: normalizePlaceholderPreservationRules(
      persisted.placeholderPreservationRules,
      defaults.placeholderPreservationRules
    ),
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
              thinkingLevel: '',
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
              thinkingLevel: normalizedProviderSettings.thinkingLevel,
              thinkingBudget: normalizedProviderSettings.thinkingBudget,
              setThinkingBudget: normalizedProviderSettings.setThinkingBudget,
              providerSettings: {
                ...state.providerSettings,
                [p]: normalizedProviderSettings,
              },
            };
          }

          // 2) apiKey / customModelConfig / useThinking / thinkingLevel / thinkingBudget / setThinkingBudget 변경 시 현재 provider 설정에 반영
          const currentProvider = newState.modelProvider;
          const currentProviderSettingsRaw = newState.providerSettings[currentProvider] || {
            baseUrl: '',
            apiKey: '',
            customModelConfig: getDefaultModelConfig(),
            useThinking: false,
            thinkingLevel: '',
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
            thinkingLevel:
              update.thinkingLevel !== undefined
                ? update.thinkingLevel
                : currentProviderSettings.thinkingLevel,
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
                          thinkingLevel: providerPatched.thinkingLevel,
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
                      thinkingLevel: providerPatched.thinkingLevel,
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
            thinkingLevel: '',
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
            thinkingLevel: nextActive.thinkingLevel,
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
                  thinkingLevel: nextActive.thinkingLevel,
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
            thinkingLevel: '',
            thinkingBudget: 2000,
            setThinkingBudget: false,
          };
          const { normalized, activeSlot } = normalizeOpenAiCompatibleSettings(openAiSettings);
          const slots = Array.isArray(normalized.slots) ? normalized.slots : [];
          const maxExistingSlotNumber = slots.reduce((max, slot) => {
            const match = /^Slot (\\d+)$/.exec(slot.name ?? '');
            if (!match) {
              return max;
            }
            const slotNumber = Number.parseInt(match[1], 10);
            return Number.isNaN(slotNumber) ? max : Math.max(max, slotNumber);
          }, 0);
          const nextSlotNumber = maxExistingSlotNumber + 1;
          const newSlot = createSlot({
            name: `Slot ${nextSlotNumber}`,
            baseUrl: activeSlot.baseUrl,
            apiKey: activeSlot.apiKey,
            customModelConfig: activeSlot.customModelConfig,
            useThinking: activeSlot.useThinking,
            thinkingLevel: activeSlot.thinkingLevel,
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
            thinkingLevel: newSlot.thinkingLevel,
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
                  thinkingLevel: newSlot.thinkingLevel,
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
            thinkingLevel: '',
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
            thinkingLevel: nextActive.thinkingLevel,
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
                  thinkingLevel: nextActive.thinkingLevel,
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
            thinkingLevel: '',
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
      version: 1,
      merge: (persistedState, currentState) => {
        const normalizedConfig = normalizeRehydratedConfig(persistedState);
        return {
          ...currentState,
          ...normalizedConfig,
        };
      },
    }
  )
);
