import { AiModelName } from '../ai/model';
import { SourceLanguage } from '../utils/language';
import type { TextPath, TranslatedTextPath } from './common';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TranslatorRequest<TExtra = any> {
  sourceLanguage: SourceLanguage;
  sourceFilePath: string;
  textPaths: TextPath<TExtra>[];
  maxOutputTokenCount: number;
  modelName: AiModelName;
  apiKey: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TranslatorResponse<TExtra = any> {
  translatedFilePath: string;
  textPaths: TranslatedTextPath<TExtra>[];
}

export interface TranslationResult {
  text: string;
  indices: number[];
}
