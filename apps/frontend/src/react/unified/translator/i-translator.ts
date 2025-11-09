import { AiTranslatorConfig } from '@/react/types/config';
import { TranslationUnit } from '../domain/translation-unit';

export interface ITranslator {
  translate(
    units: TranslationUnit[],
    config: AiTranslatorConfig,
    promptPresetContent?: string,
    sourceFilePath?: string
  ): Promise<TranslationUnit[]>;
}
