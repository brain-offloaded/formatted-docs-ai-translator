import { useCallback } from 'react';
import { TranslationOutput } from '@/react/unified/domain/translation-output';
import { TranslationInput } from '@/react/unified/domain/translation-input';
import { TranslatorEngine } from '@/react/unified/engine/translator-engine';
import { TranslationUnit } from '@/react/unified/domain/translation-unit';
import { translationStrategyFactory } from '@/react/factories/translation-strategy-factory';
import type { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';
import type { AiTranslatorConfig } from '@/react/types/config';
import type { Job } from '@/react/services/job-manager/job';
import { JobStatus } from '@/react/services/job-manager/job';
import type { TranslationOutput as TranslationOutputType } from '@/react/unified/domain/translation-output';
import type { TranslationResultState, UIState } from '@/react/contexts/TranslationContext';
import { TranslationType } from '@/react/contexts/TranslationContext';
import type { TranslationJobManager } from '@/react/services/job-manager/TranslationJobManager';
import type { TFunction } from 'i18next';
import type { IApplier } from '@/react/unified/applier/i-applier';
import { batchTranslateParsedResults, BatchParseResult } from './batch-translation';

interface UseTranslationRunnerOptions<T extends BaseParseOptionsDto> {
  input: string | File[];
  config: AiTranslatorConfig;
  translationType: TranslationType;
  validateInput: (input: string | File[]) => boolean;
  translatorEngine: TranslatorEngine<TranslationInput, TranslationUnit[], TranslationOutputType>;
  parserOptions?: T | null;
  promptPresetContent?: string;
  currentIsFileInput: boolean;
  isTranslating: boolean;
  setIsTranslating: (value: boolean) => void;
  setResultState: (
    updater: TranslationResultState | ((prev: TranslationResultState) => TranslationResultState)
  ) => void;
  setUIState: (updater: UIState | ((prev: UIState) => UIState)) => void;
  getJobManager: () => TranslationJobManager<File | string>;
  resetJobManager: () => void;
  ensureCacheTagExists: () => Promise<boolean>;
  showSnackbar: (message: string) => void;
  t: TFunction;
}

const buildFailureOutputs = (jobs: Job<File | string>[], t: TFunction) =>
  jobs
    .filter((job) => job.status === JobStatus.FAILED || job.status === JobStatus.CANCELLED)
    .map((job) => {
      const jobData = job.data;
      const name = typeof jobData === 'string' ? t('translationRunner.text') : jobData.name;
      const message =
        job.status === JobStatus.CANCELLED
          ? t('translationRunner.userCancelled')
          : (job.error as Error)?.message || t('translationRunner.unknownError');

      return new TranslationOutput([
        {
          name,
          success: false,
          message,
          result: message,
          originalFileName: typeof jobData === 'string' ? undefined : jobData.name,
        },
      ]);
    });

const createResultSummary = (
  total: number,
  success: number,
  fail: number,
  totalSize: number,
  processingTime: number,
  t: TFunction
) => {
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
  let summary = t('translationRunner.completionSummary', {
    successRate,
    total,
    totalSize: (totalSize / 1024 / 1024).toFixed(1),
    processingTime: (processingTime / 1000).toFixed(1),
  });
  if (success > 0) summary += t('translationRunner.successLine', { count: success });
  if (fail > 0) summary += t('translationRunner.failLine', { count: fail });
  return summary;
};

export const useTranslationRunner = <T extends BaseParseOptionsDto>({
  input,
  config,
  translationType,
  validateInput,
  translatorEngine,
  parserOptions,
  promptPresetContent,
  currentIsFileInput,
  isTranslating,
  setIsTranslating,
  setResultState,
  setUIState,
  getJobManager,
  resetJobManager,
  ensureCacheTagExists,
  showSnackbar,
  t,
}: UseTranslationRunnerOptions<T>) =>
  useCallback(async () => {
    if (isTranslating) return;

    const isCacheTagValid = await ensureCacheTagExists();
    if (!isCacheTagValid) return;

    const translationStartTime = Date.now();
    const shouldBatchAcrossFiles =
      currentIsFileInput &&
      Array.isArray(input) &&
      input.length > 1 &&
      !!parserOptions?.batchRequestAcrossFiles &&
      translationType !== TranslationType.Image;

    try {
      if (!validateInput(input)) {
        throw new Error(t('translationRunner.invalidInput'));
      }

      setUIState((prev) => ({
        ...prev,
        translationProgress: 0,
        progressMessage: t('translationRunner.preparing'),
        completed: 0,
        totalJobs: 0,
        failed: 0,
        cancelled: 0,
      }));

      setResultState({
        translationResult: null,
        report: null,
        zipBlob: null,
        singleFileBlob: null,
        singleFileName: null,
        imageResult: null,
      });

      resetJobManager();
      setIsTranslating(true);
      const manager = getJobManager();

      manager.on('onProgress', ({ total, completed, failed, cancelled }) => {
        const finished = completed + failed + cancelled;
        const progress = total > 0 ? (finished / total) * 100 : 0;
        setUIState((prev) => ({
          ...prev,
          translationProgress: progress,
          progressMessage: t('translationRunner.inProgress'),
          completed: completed + cancelled,
          totalJobs: total,
          failed,
          cancelled,
        }));
      });

      const buildBatchOutputs = async (
        results: Job<File | string>[]
      ): Promise<TranslationOutputType[]> => {
        const failedOutputs = buildFailureOutputs(results, t);
        const successfulJobs = results.filter(
          (job) => job.status === JobStatus.SUCCEEDED && job.result
        ) as Array<
          Job<File | string> & { result: BatchParseResult<TranslationInput, TranslationOutputType> }
        >;

        if (successfulJobs.length === 0) {
          return failedOutputs;
        }

        const parsedResults = successfulJobs.map((job) => job.result);

        const outputs: TranslationOutputType[] = [];

        try {
          const appliedOutputs = await batchTranslateParsedResults({
            translatorEngine,
            parsedResults,
            config,
            promptPresetContent,
          });
          outputs.push(...appliedOutputs);
        } catch (error) {
          const message = (error as Error)?.message || t('translationRunner.unknownError');
          parsedResults.forEach((parsedResult) => {
            const jobData = parsedResult.translationInput.content;
            const name = typeof jobData === 'string' ? t('translationRunner.text') : jobData.name;
            outputs.push(
              new TranslationOutput([
                {
                  name,
                  success: false,
                  message,
                  result: message,
                  originalFileName: typeof jobData === 'string' ? undefined : jobData.name,
                },
              ])
            );
          });
        }

        outputs.push(...failedOutputs);
        return outputs;
      };

      manager.on('onAllComplete', async (results: Job<File | string>[]) => {
        const cancelledCount = results.filter((job) => job.status === JobStatus.CANCELLED).length;

        if (cancelledCount > 0 && cancelledCount === results.length && results.length > 0) {
          setUIState((prev) => ({
            ...prev,
            translationProgress: 0,
            progressMessage: t('translationRunner.cancelled'),
            completed: 0,
            totalJobs: results.length,
            failed: 0,
            cancelled: cancelledCount,
          }));
          setIsTranslating(false);
          showSnackbar(t('translationRunner.cancelled'));
          return;
        }

        const outputs: TranslationOutputType[] = shouldBatchAcrossFiles
          ? await buildBatchOutputs(results)
          : [
              ...results
                .filter((job) => job.status === JobStatus.SUCCEEDED && job.result)
                .map((job) => job.result as TranslationOutputType),
              ...buildFailureOutputs(results, t),
            ];

        setUIState((prev) => ({
          ...prev,
          translationProgress: 95,
          progressMessage: t('translationRunner.aggregating'),
        }));

        const finalOutput = TranslationOutput.merge(outputs);
        const { results: aggregated, total, success, fail } = finalOutput.getAggregatedReport();
        const hasFailure = fail > 0;

        if (currentIsFileInput) {
          const zipBlob = await finalOutput.toZip();
          const singleFile = await finalOutput.getSingleFile();
          const totalSize = Array.isArray(input)
            ? input.reduce((acc, file) => acc + file.size, 0)
            : 0;
          const processingTime = Date.now() - translationStartTime;
          const resultSummary = createResultSummary(
            total,
            success,
            fail,
            totalSize,
            processingTime,
            t
          );
          const isFatalError = fail === total && total > 0;

          setResultState({
            translationResult: { text: resultSummary, isError: isFatalError },
            report: {
              total,
              success,
              fail,
              successRate: total > 0 ? Math.round((success / total) * 100) : 0,
              totalSize,
              processingTime,
              items: aggregated.map((r) => ({
                name: r.name,
                success: r.success,
                errorMessage: r.success
                  ? undefined
                  : r.items
                      .map((i) => i.message)
                      .filter((m): m is string => !!m && m.trim().length > 0)
                      .join('\n'),
                fileSize: Array.isArray(input)
                  ? input.find((f) => f.name === r.name)?.size
                  : undefined,
              })),
            },
            zipBlob,
            singleFileBlob: singleFile?.blob || null,
            singleFileName: singleFile?.name || null,
          });
          const failureMessage = fail > 0 ? `, ${fail}개 실패` : '';
          showSnackbar(
            t('translationRunner.filesCompleted', {
              total,
              success,
              failureMessage,
            })
          );
        } else {
          const result = finalOutput.getResult();
          const resultText =
            result instanceof Blob
              ? await result.text()
              : Array.isArray(result)
                ? result.join('\n')
                : (result as string);
          const errorMessages = results
            .filter((job) => job.status === JobStatus.FAILED || job.status === JobStatus.CANCELLED)
            .map((job) => {
              const jobData = job.data;
              const name = typeof jobData === 'string' ? t('translationRunner.text') : jobData.name;
              if (job.status === JobStatus.CANCELLED) {
                return `${name}: ${t('translationRunner.userCancelled')}`;
              }
              const error = job.error as Error | undefined;
              return `${name}: ${error?.message ?? t('translationRunner.unknownError')}`;
            })
            .join('\n');
          const fallbackErrorText = errorMessages
            ? `${t('translationRunner.someFailures')}\n${errorMessages}`
            : t('translationRunner.someFailures');
          setResultState({
            translationResult: {
              text: hasFailure ? fallbackErrorText : resultText,
              isError: hasFailure,
            },
            report: null,
            zipBlob: null,
            singleFileBlob: null,
            singleFileName: null,
            imageResult: null,
          });
          showSnackbar(
            hasFailure ? t('translationRunner.someFailures') : t('translationRunner.allCompleted')
          );
        }

        setUIState((prev) => ({
          ...prev,
          translationProgress: 100,
          progressMessage: t('translationRunner.completed'),
        }));
        setIsTranslating(false);
      });

      const itemsToTranslate = Array.isArray(input) ? input : [input];
      manager.add(itemsToTranslate);

      const worker = async (job: Job<File | string>) => {
        const jobInput = job.data;
        const translationInput = new TranslationInput(
          jobInput,
          parserOptions || ({} as T),
          config,
          promptPresetContent
        );
        if (shouldBatchAcrossFiles) {
          const strategy = translationStrategyFactory.create(translationType);
          const parsed = await strategy.parser.parse(translationInput);
          return {
            translationInput,
            parsed,
            applier: strategy.applier,
          } as BatchParseResult<TranslationInput, TranslationOutputType>;
        }
        return translatorEngine.translate(translationInput);
      };

      manager.start(worker);
    } catch (error) {
      console.error('번역 오류:', error);
      setResultState({
        translationResult: {
          text: `오류가 발생했습니다: ${(error as Error).message}`,
          isError: true,
        },
        report: null,
        zipBlob: null,
        singleFileBlob: null,
        singleFileName: null,
        imageResult: null,
      });
      setIsTranslating(false);
    }
  }, [
    input,
    config,
    translationType,
    validateInput,
    translatorEngine,
    parserOptions,
    promptPresetContent,
    currentIsFileInput,
    isTranslating,
    setIsTranslating,
    setResultState,
    setUIState,
    getJobManager,
    resetJobManager,
    ensureCacheTagExists,
    showSnackbar,
    t,
  ]);
