import { AiProvider, ModelConfig } from '../ai/model';
import { SourceLanguage } from '../utils/language';

export interface TranslatorConfig {
  aiProvider: AiProvider;
  sourceLanguage: SourceLanguage;
  apiKey: string;
  customModelConfig: ModelConfig;
  isCustomInputMode: boolean;
  lastPresetName?: string; // 예제 프리셋 이름
  lastPromptPresetName?: string; // 프롬프트 프리셋 이름 추가
  useThinking: boolean; // AI의 "생각" 과정 활성화 여부
  thinkingBudget: number; // "생각" 과정에 사용될 예산 (토큰 수)
}

export type TranslatorConfigUpdate = Partial<TranslatorConfig>;
