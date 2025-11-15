import { TranslatorAiSettings } from '@/nest/translator/common/dto/translator-settings.dto';

export interface TextTranslateParam {
  requestId: string;
  sourceTexts: string[];
  promptPresetContent: string;
  aiSettings: TranslatorAiSettings;
  cacheTag: string;
}

export interface ImageTranslateParam {
  requestId: string;
  fileName?: string;
  imageData: string; // base64 encoded image data
  promptPresetContent: string;
  aiSettings: TranslatorAiSettings;
  cacheTag?: string;
}

export type TranslateParam = TextTranslateParam | ImageTranslateParam;
