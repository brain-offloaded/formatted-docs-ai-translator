import type { TranslatorModelConfigDto } from '@/react/api/generated/models/TranslatorModelConfigDto';
import type { TranslatorAiSettingsDto } from '@/react/api/generated/models/TranslatorAiSettingsDto';
import { SourceLanguage, TargetLanguage } from '@apps/common/dist/language';

export type ModelProvider = TranslatorAiSettingsDto.modelProvider;
export type SourceLanguage = UiSourceLanguage;
export type TargetLanguage = UiTargetLanguage;

export interface ProviderSlotConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  customModelConfig: TranslatorModelConfigDto;
  useThinking: boolean;
  thinkingBudget: number;
  setThinkingBudget: boolean;
}

// Provider 별 개별로 저장될 설정 묶음
export interface ProviderSpecificConfig {
  baseUrl: string;
  apiKey: string;
  customModelConfig: TranslatorModelConfigDto;
  useThinking: boolean;
  thinkingBudget: number;
  setThinkingBudget: boolean;
  slots?: ProviderSlotConfig[];
  activeSlotId?: string;
}

export interface AiTranslatorConfig {
  modelProvider: ModelProvider;
  sourceLanguage: SourceLanguage;
  targetLanguage: TargetLanguage;
  // NOTE: backend 호환성을 위해 기존 필드 유지 (현재 선택된 provider의 설정을 반영)
  apiKey: string;
  baseUrl: string;
  customModelConfig: TranslatorModelConfigDto;
  cacheTag: string;
  beginnerModeEnabled: boolean;
  selectedModelPresetId?: number;
  lastPresetName?: string; // 예제 프리셋 이름
  lastPromptPresetName?: string; // 텍스트 번역 프롬프트 프리셋 이름 (호환성 유지)
  lastTextPromptPresetName?: string; // 텍스트 번역 프롬프트 프리셋 이름
  lastImagePromptPresetName?: string; // 이미지 번역 프롬프트 프리셋 이름
  useThinking: boolean; // AI의 "생각" 과정 활성화 여부 (현재 provider용)
  thinkingBudget: number; // "생각" 과정에 사용될 예산 (토큰 수) (현재 provider용)
  setThinkingBudget: boolean; // "생각" 예산 설정 여부 (현재 provider용)
  // Provider 별 분리 저장 영역
  providerSettings: Record<ModelProvider, ProviderSpecificConfig>;
}

export type TranslatorConfigUpdate = Partial<AiTranslatorConfig>;
