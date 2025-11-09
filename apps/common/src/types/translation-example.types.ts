import { TargetLanguage } from '@/language';

export interface TranslationExamplePair {
  sourceLines: string[];
  resultLines: string[];
}

export type TranslationExampleMatrix = Record<
  TargetLanguage,
  Record<TargetLanguage, TranslationExamplePair>
>;
