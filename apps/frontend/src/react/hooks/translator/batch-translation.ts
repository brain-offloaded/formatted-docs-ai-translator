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
  isCancellationRequested?: () => boolean;
}

export class BatchTranslationCancelledError extends Error {
  constructor() {
    super('Batch translation cancelled');
    this.name = 'BatchTranslationCancelledError';
  }
}

const buildBatchScopedKey = (fileIndex: number, key: string) => `batch:${fileIndex}:${key}`;

const throwIfCancelled = (isCancellationRequested?: () => boolean) => {
  if (isCancellationRequested?.()) {
    throw new BatchTranslationCancelledError();
  }
};

export const batchTranslateParsedResults = async <
  TInput extends TranslationInput,
  TOutput extends TranslationOutput,
>({
  translatorEngine,
  parsedResults,
  config,
  promptPresetContent,
  onProgress,
  isCancellationRequested,
}: BatchTranslateOptions<TInput, TOutput>): Promise<TOutput[]> => {
  throwIfCancelled(isCancellationRequested);

  const combinedIndexMap: Array<{ fileIndex: number; unitIndex: number }> = [];
  const combinedUnits: TranslationUnit[] = [];

  parsedResults.forEach((parsedResult, fileIndex) => {
    parsedResult.parsed.forEach((unit, unitIndex) => {
      combinedUnits.push({
        ...unit,
        key: buildBatchScopedKey(fileIndex, unit.key),
      });
      combinedIndexMap.push({ fileIndex, unitIndex });
    });
  });

  throwIfCancelled(isCancellationRequested);

  const translatedCombined: TranslationUnit[] = combinedUnits.length
    ? await translatorEngine.translateUnits(
        combinedUnits,
        config,
        promptPresetContent ?? undefined,
        undefined, // sourceFilePath
        (completed, total) => {
          if (isCancellationRequested?.()) {
            return;
          }
          onProgress?.(completed, total);
        } // 백엔드 스트리밍에서 진행률을 보고받음
      )
    : [];

  throwIfCancelled(isCancellationRequested);

  // 번역이 없는 경우에도 완료 보고
  if (combinedUnits.length === 0) {
    onProgress?.(0, 0);
  }

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

  throwIfCancelled(isCancellationRequested);

  const appliedOutputs = await Promise.all(
    parsedResults.map((parsedResult, index) =>
      parsedResult.applier.apply(parsedResult.translationInput, translatedByFile[index])
    )
  );

  throwIfCancelled(isCancellationRequested);

  return appliedOutputs;
};
