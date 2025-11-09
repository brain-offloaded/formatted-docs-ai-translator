import { useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import type { StoreApi } from 'zustand';
import type { TranslationStore } from '@/react/stores/translation-store';
import { createInitialUIState } from '@/react/stores/translation-store';
import { useTranslationJobManager } from './useTranslationJobManager';
import { useSnackbarController } from './useSnackbarController';
import { TranslationType } from './types';
import type { TranslationJobManager } from '@/react/services/job-manager/TranslationJobManager';
import { useTranslation } from 'react-i18next';

interface UseTranslationControllerOptions {
  store: StoreApi<TranslationStore>;
  concurrencyLimit: number;
}

export const useTranslationController = ({
  store,
  concurrencyLimit,
}: UseTranslationControllerOptions) => {
  const {
    getJobManager,
    cancelTranslation: cancelJobs,
    isJobManagerActive,
    resetJobManager,
  } = useTranslationJobManager<File | string>({ concurrencyLimit });

  const { showSnackbar } = useSnackbarController({ setUIState: store.getState().setUIState });
  const { t } = useTranslation();

  const handleClearFiles = useCallback(() => {
    const { resetFileState, resetResultState, setUIState } = store.getState();
    resetFileState();
    resetResultState();
    setUIState((prev) => ({
      ...createInitialUIState(),
      snackbarOpen: prev.snackbarOpen,
      snackbarMessage: prev.snackbarMessage,
    }));
  }, [store]);

  const cancelTranslation = useCallback(() => {
    cancelJobs();
    store.getState().setIsTranslating(false);
  }, [cancelJobs, store]);

  const showTranslationResult = useCallback(
    async (
      zip?: JSZip,
      hasError?: boolean,
      fileResults?: { name: string; success: boolean; message?: string }[],
      successCount?: number,
      errorCount?: number
    ) => {
      const { translationType, setResultState } = store.getState();
      if (translationType === TranslationType.Text) {
        return;
      }

      if (
        !zip ||
        fileResults === undefined ||
        successCount === undefined ||
        errorCount === undefined
      ) {
        return;
      }

      let resultText = '';

      if (successCount > 0) {
        resultText += t('translationController.successFiles', { count: successCount }) + '\n\n';
      }

      if (errorCount > 0) {
        resultText += t('translationController.errorFiles', { count: errorCount }) + '\n\n';
      }

      resultText += t('translationController.fileResults') + '\n';
      for (const result of fileResults) {
        resultText += `${result.name}: ${result.success ? t('translationController.success') : t('translationController.failed')}`;
        if (!result.success && result.message) {
          resultText += ` (${result.message})`;
        }
        resultText += '\n';
      }

      try {
        const filesInZip = Object.keys(zip.files);
        const numFilesInZip = filesInZip.length;

        if (numFilesInZip === 1) {
          const fileName = filesInZip[0];
          const fileEntry = zip.file(fileName);
          if (!fileEntry) {
            throw new Error(t('translationController.zipFileNotFound', { fileName }));
          }
          const fileBlob = await fileEntry.async('blob');
          setResultState({
            translationResult: { text: resultText, isError: hasError || false },
            zipBlob: null,
            singleFileBlob: fileBlob,
            singleFileName: fileName,
            report: null,
            imageResult: null,
          });
          return;
        }

        if (numFilesInZip > 1) {
          const blob = await zip.generateAsync({ type: 'blob' });
          setResultState({
            translationResult: { text: resultText, isError: hasError || false },
            zipBlob: blob,
            singleFileBlob: null,
            singleFileName: null,
            report: null,
            imageResult: null,
          });
          return;
        }

        throw new Error(t('translationController.noTranslationResult'));
      } catch (error) {
        console.error('번역 결과 처리 오류:', error);
        showSnackbar(
          t('translationController.processError', {
            message: error instanceof Error ? error.message : t('errors.unknown'),
          })
        );
      }
    },
    [showSnackbar, store, t]
  );

  return useMemo(
    () => ({
      getJobManager: getJobManager as () => TranslationJobManager<File | string>,
      cancelTranslation,
      isJobManagerActive,
      resetJobManager,
      showSnackbar,
      handleClearFiles,
      showTranslationResult,
    }),
    [
      cancelTranslation,
      getJobManager,
      handleClearFiles,
      isJobManagerActive,
      resetJobManager,
      showSnackbar,
      showTranslationResult,
    ]
  );
};
