import { AiModelName } from '../ai/model';
import { SourceLanguage } from '../utils/language';
import type { TextPath, TranslatedTextPath } from './common';

export interface TranslatorRequest {
  sourceLanguage: SourceLanguage;
  sourceFilePath: string;
  textPaths: TextPath[];
  maxOutputTokenCount: number;
  modelName: AiModelName;
  apiKey: string;
}

export interface TranslatorResponse {
  translatedFilePath: string;
  textPaths: TranslatedTextPath[];
}

export interface TranslationResult {
  text: string;
  indices: number[];
}
