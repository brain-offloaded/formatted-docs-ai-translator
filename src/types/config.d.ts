import { ModelConfig } from '../ai/model';
import { SourceLanguage } from '../utils/language';

export interface TranslatorConfig {
  sourceLanguage: SourceLanguage;
  apiKey: string;
  customModelConfig: ModelConfig;
  isCustomInputMode: boolean;
  lastPresetName?: string; // 예제 프리셋 이름
  lastPromptPresetName?: string; // 프롬프트 프리셋 이름 추가
}

export type TranslatorConfigUpdate = Partial<TranslatorConfig>;
