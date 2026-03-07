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
import {
  batchTranslateParsedResults,
  BatchParseResult,
  BatchTranslationCancelledError,
} from './batch-translation';
import {
  containsLegacyTranslatedTextKey,
  LEGACY_TRANSLATED_TEXT_WARNING_MESSAGE,
} from '@/react/utils/legacy-prompt-warning';
import { deriveFileTranslationOutcome } from './file-translation-outcome';

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
    const shouldUseSegmentBasedProgress = translationType !== TranslationType.Image;

    try {
      if (!validateInput(input)) {
        throw new Error(t('translationRunner.invalidInput'));
      }

      if (
        translationType !== TranslationType.Image &&
        containsLegacyTranslatedTextKey(promptPresetContent)
      ) {
        showSnackbar(LEGACY_TRANSLATED_TEXT_WARNING_MESSAGE);
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

      // 세그먼트 진행률 모드에서는 Job 완료를 "파싱 완료"로 취급한다.
      // 파싱 중: 0% 유지, 번역 중: TranslationUnit 기준으로 0~100% 갱신
      manager.on('onProgress', ({ total, completed, failed, cancelled }) => {
        if (!shouldUseSegmentBasedProgress) {
          // 이미지 모드: 파일 Job 완료 기준 진행률
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
        } else {
          // 세그먼트 진행률 모드: 파싱 중에는 0% 유지
          // completed/totalJobs는 batchTranslateParsedResults onProgress에서 TranslationUnit 기준으로 업데이트
          setUIState((prev) => ({
            ...prev,
            translationProgress: 0,
            progressMessage: t('translationRunner.parsing'),
            completed: 0,
            totalJobs: 0,
            failed,
            cancelled,
          }));
        }
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
            isCancellationRequested: () => manager.isCancellationRequested(),
            onProgress: (completedUnits, totalUnits) => {
              if (manager.isCancellationRequested()) {
                return;
              }
              // 순수 번역 진행률: 0% ~ 100% (TranslationUnit 기준)
              const translationProgress = totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0;
              const isApplyingPhase = completedUnits === totalUnits && totalUnits > 0;
              setUIState((prev) => ({
                ...prev,
                translationProgress: translationProgress,
                progressMessage: isApplyingPhase
                  ? t('translationRunner.aggregating')
                  : t('translationRunner.translating'),
                // 번역 완료된 TranslationUnit 개수 기준으로 completed와 totalJobs 업데이트
                completed: completedUnits,
                totalJobs: totalUnits,
              }));
            },
          });
          outputs.push(...appliedOutputs);
        } catch (error) {
          if (
            error instanceof BatchTranslationCancelledError ||
            manager.isCancellationRequested()
          ) {
            throw error;
          }
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
        const applyCancelledState = () => {
          setUIState((prev) => ({
            ...prev,
            translationProgress: 0,
            progressMessage: t('translationRunner.cancelled'),
            completed: 0,
            totalJobs: results.length,
            failed: 0,
            cancelled: Math.max(cancelledCount, 1),
          }));
          setIsTranslating(false);
        };
        const shouldAbortPostProcessing = () => {
          if (!manager.isCancellationRequested()) {
            return false;
          }
          applyCancelledState();
          return true;
        };

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

        if (shouldAbortPostProcessing()) {
          return;
        }

        let outputs: TranslationOutputType[] = [];
        try {
          outputs = shouldUseSegmentBasedProgress
            ? await buildBatchOutputs(results)
            : [
                ...results
                  .filter((job) => job.status === JobStatus.SUCCEEDED && job.result)
                  .map((job) => job.result as TranslationOutputType),
                ...buildFailureOutputs(results, t),
              ];
        } catch (error) {
          if (
            error instanceof BatchTranslationCancelledError ||
            manager.isCancellationRequested()
          ) {
            applyCancelledState();
            return;
          }
          throw error;
        }

        if (shouldAbortPostProcessing()) {
          return;
        }

        setUIState((prev) => ({
          ...prev,
          translationProgress: 95,
          progressMessage: t('translationRunner.aggregating'),
        }));

        if (shouldAbortPostProcessing()) {
          return;
        }

        const finalOutput = TranslationOutput.merge(outputs);
        const { results: aggregated } = finalOutput.getAggregatedReport();
        const fileOutcome = deriveFileTranslationOutcome({
          aggregated,
          strictFailureAbortMessage: t('translationRunner.strictFailureAborted'),
        });
        const { total, success, fail, isFatalError, items, hasStrictFailure } = fileOutcome;
        const hasFailure = fail > 0;

        if (currentIsFileInput) {
          if (shouldAbortPostProcessing()) {
            return;
          }

          const zipBlob = await finalOutput.toZip();

          if (shouldAbortPostProcessing()) {
            return;
          }

          const singleFile = await finalOutput.getSingleFile();

          if (shouldAbortPostProcessing()) {
            return;
          }

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
          setResultState({
            translationResult: { text: resultSummary, isError: isFatalError },
            report: {
              total,
              success,
              fail,
              successRate: total > 0 ? Math.round((success / total) * 100) : 0,
              totalSize,
              processingTime,
              items: items.map((item) => ({
                ...item,
                fileSize: Array.isArray(input)
                  ? input.find((f) => f.name === item.name)?.size
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
          if (shouldAbortPostProcessing()) {
            return;
          }

          const result = finalOutput.getResult();
          const resultText =
            result instanceof Blob
              ? await result.text()
              : Array.isArray(result)
                ? result.join('\n')
                : (result as string);

          if (shouldAbortPostProcessing()) {
            return;
          }

          const errorMessages = new Set(
            results
              .filter(
                (job) => job.status === JobStatus.FAILED || job.status === JobStatus.CANCELLED
              )
              .map((job) => {
                const jobData = job.data;
                const name =
                  typeof jobData === 'string' ? t('translationRunner.text') : jobData.name;
                if (job.status === JobStatus.CANCELLED) {
                  return `${name}: ${t('translationRunner.userCancelled')}`;
                }
                const error = job.error as Error | undefined;
                return `${name}: ${error?.message ?? t('translationRunner.unknownError')}`;
              })
          );

          if (shouldUseSegmentBasedProgress) {
            finalOutput
              .getResults()
              .filter((item) => !item.success)
              .forEach((item) => {
                const name = item.originalFileName ?? item.name;
                const message = item.message?.trim() || t('translationRunner.unknownError');
                errorMessages.add(`${name}: ${message}`);
              });
          }

          const combinedErrorMessages = Array.from(errorMessages).join('\n');
          const fallbackErrorText = combinedErrorMessages
            ? `${t('translationRunner.someFailures')}\n${combinedErrorMessages}`
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

        if (shouldAbortPostProcessing()) {
          return;
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

      // 세그먼트 진행률 모드에서는 strategy를 한 번만 생성해 parse/applier를 재사용한다.
      const batchStrategy = shouldUseSegmentBasedProgress
        ? translationStrategyFactory.create(translationType)
        : null;

      const worker = async (job: Job<File | string>) => {
        const jobInput = job.data;
        const translationInput = new TranslationInput(
          jobInput,
          parserOptions || ({} as T),
          config,
          promptPresetContent
        );
        if (shouldUseSegmentBasedProgress && batchStrategy) {
          const parsed = await batchStrategy.parser.parse(translationInput);
          return {
            translationInput,
            parsed,
            applier: batchStrategy.applier,
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
