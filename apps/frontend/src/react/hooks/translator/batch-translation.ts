import { AiTranslatorConfig } from '@/react/types/config';
import { TranslatorEngine } from '@/react/unified/engine/translator-engine';
import { TranslationInput } from '@/react/unified/domain/translation-input';
import { TranslationOutput } from '@/react/unified/domain/translation-output';
import { TranslationUnit } from '@/react/unified/domain/translation-unit';
import type { IApplier } from '@/react/unified/applier/i-applier';

export interface BatchParseResult<
  TInput extends TranslationInput,
  TOutput extends TranslationOutput,
> {
  translationInput: TInput;
  parsed: TranslationUnit[];
  applier: IApplier<TInput, TranslationUnit[], TOutput>;
}

interface BatchTranslateOptions<
  TInput extends TranslationInput,
  TOutput extends TranslationOutput,
> {
  translatorEngine: TranslatorEngine<TInput, TranslationUnit[], TOutput>;
  parsedResults: BatchParseResult<TInput, TOutput>[];
  config: AiTranslatorConfig;
  promptPresetContent?: string | null;
  onProgress?: (completed: number, total: number) => void;
}

export const batchTranslateParsedResults = async <
  TInput extends TranslationInput,
  TOutput extends TranslationOutput,
>({
  translatorEngine,
  parsedResults,
  config,
  promptPresetContent,
  onProgress,
}: BatchTranslateOptions<TInput, TOutput>): Promise<TOutput[]> => {
  const combinedIndexMap: Array<{ fileIndex: number; unitIndex: number }> = [];
  const combinedUnits: TranslationUnit[] = [];

  parsedResults.forEach((parsedResult, fileIndex) => {
    parsedResult.parsed.forEach((unit, unitIndex) => {
      combinedUnits.push(unit);
      combinedIndexMap.push({ fileIndex, unitIndex });
    });
  });

  const totalUnits = combinedUnits.length;
  onProgress?.(0, totalUnits);

  const translatedCombined: TranslationUnit[] = combinedUnits.length
    ? await translatorEngine.translateUnits(combinedUnits, config, promptPresetContent ?? undefined)
    : [];

  onProgress?.(totalUnits, totalUnits);

  const translatedByFile = parsedResults.map((parsedResult) =>
    parsedResult.parsed.map((unit) => ({ ...unit }))
  );

  combinedIndexMap.forEach(({ fileIndex, unitIndex }, index) => {
    const translatedUnit = translatedCombined[index];
    if (!translatedUnit) {
      console.warn(
        `[batch-translation] translatedUnit이 없습니다. index=${index}, fileIndex=${fileIndex}, unitIndex=${unitIndex}`
      );
      return;
    }
    translatedByFile[fileIndex][unitIndex] = {
      ...translatedByFile[fileIndex][unitIndex],
      target: translatedUnit.target,
    };
  });

  const appliedOutputs = await Promise.all(
    parsedResults.map((parsedResult, index) =>
      parsedResult.applier.apply(parsedResult.translationInput, translatedByFile[index])
    )
  );

  return appliedOutputs;
};
