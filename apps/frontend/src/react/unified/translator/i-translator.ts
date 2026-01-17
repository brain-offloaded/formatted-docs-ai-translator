import { AiTranslatorConfig } from '@/react/types/config';
import { TranslationUnit } from '../domain/translation-unit';

export interface TranslationProgressCallback {
  (completed: number, total: number): void;
}

export interface ITranslator {
  translate(
    units: TranslationUnit[],
    config: AiTranslatorConfig,
    promptPresetContent?: string,
    sourceFilePath?: string,
    onProgress?: TranslationProgressCallback
  ): Promise<TranslationUnit[]>;
}
