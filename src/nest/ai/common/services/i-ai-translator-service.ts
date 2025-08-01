import { SourceLanguage } from '../../../../utils/language';
import { AiModelName } from '../../../../ai/model';
import { FilePathInfo } from '@/types/cache';

export interface AiTranslateParam {
  sourceTexts: string[];
  sourceLanguage: SourceLanguage;
  fileInfo?: FilePathInfo;
  maxOutputTokenCount?: number;
  requestsPerMinute?: number;
  apiKey: string;
  promptPresetContent?: string;
  thinkingMode?: boolean;
}

export interface IAiTranslatorService<ModelName extends AiModelName> {
  translate(modelName: ModelName, param: AiTranslateParam): Promise<string[]>;

  getEstimatedTokenCount(texts: string[] | string): Promise<number>;
}
