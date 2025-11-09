import { targetLanguages, type TargetLanguage } from '@apps/common/dist/language';
import {
  TranslationExampleMatrix,
  TranslationExamplePair,
} from '@apps/common/dist/types/translation-example.types';

type PartialExampleMatrix = Partial<
  Record<TargetLanguage, Partial<Record<TargetLanguage, TranslationExamplePair | undefined>>>
>;

export const createEmptyExamplePair = (): TranslationExamplePair => ({
  sourceLines: [],
  resultLines: [],
});

export const createEmptyExampleMatrix = (): TranslationExampleMatrix => {
  const matrix = {} as TranslationExampleMatrix;
  for (const source of targetLanguages) {
    matrix[source] = {} as Record<TargetLanguage, TranslationExamplePair>;
    for (const target of targetLanguages) {
      matrix[source][target] = createEmptyExamplePair();
    }
  }
  return matrix;
};

export const normalizeExampleMatrix = (
  examples?: TranslationExampleMatrix | PartialExampleMatrix
): TranslationExampleMatrix => {
  const matrix = createEmptyExampleMatrix();
  if (!examples) {
    return matrix;
  }

  for (const source of targetLanguages) {
    const sourceExamples = examples[source];
    if (!sourceExamples) {
      continue;
    }
    for (const target of targetLanguages) {
      const entry = sourceExamples[target];
      if (!entry) {
        continue;
      }
      matrix[source][target] = {
        sourceLines: Array.isArray(entry.sourceLines) ? entry.sourceLines : [],
        resultLines: Array.isArray(entry.resultLines) ? entry.resultLines : [],
      };
    }
  }

  return matrix;
};
