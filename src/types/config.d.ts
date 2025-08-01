import { ModelProvider } from '@/ai/provider';
import { ModelConfig } from '../ai/model';
import { SourceLanguage } from '../utils/language';

export interface TranslatorConfig {
  modelProvider: ModelProvider;
  sourceLanguage: SourceLanguage;
  apiKey: string;
  customModelConfig: ModelConfig;
  lastPresetName?: string; // 예제 프리셋 이름
  lastPromptPresetName?: string; // 프롬프트 프리셋 이름 추가
  useThinking: boolean; // AI의 "생각" 과정 활성화 여부
  thinkingBudget: number; // "생각" 과정에 사용될 예산 (토큰 수)
  setThinkingBudget: boolean; // "생각" 예산 설정 여부
}

export type TranslatorConfigUpdate = Partial<TranslatorConfig>;
