import { ModelConfig } from '../ai/model';
import { SourceLanguage } from '../utils/language';

export interface TranslatorConfig {
  sourceLanguage: SourceLanguage;
  apiKey: string;
  customModelConfig: ModelConfig;
  isCustomInputMode: boolean;
  lastPresetName?: string;
}

export type TranslatorConfigUpdate = Partial<TranslatorConfig>;
