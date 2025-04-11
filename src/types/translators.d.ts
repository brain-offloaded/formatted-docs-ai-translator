import { AiModelName } from '../ai/model';
import { SourceLanguage } from '../utils/language';
import type { TextPath, TranslatedTextPath } from './common';

export interface TranslatorRequest<TExtra> {
  sourceLanguage: SourceLanguage;
  sourceFilePath: string;
  textPaths: TextPath<TExtra>[];
  maxOutputTokenCount: number;
  modelName: AiModelName;
  apiKey: string;
}

export interface TranslatorResponse<TExtra> {
  translatedFilePath: string;
  textPaths: TranslatedTextPath<TExtra>[];
}

export interface TranslationResult {
  text: string;
  indices: number[];
}
