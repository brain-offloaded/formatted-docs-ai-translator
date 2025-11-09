import { useCallback, useMemo } from 'react';
import type { TranslationResultState } from '@/react/contexts/TranslationContext';
import { useTranslation } from 'react-i18next';

interface UseDownloadControllerOptions {
  resultState: TranslationResultState;
  currentIsFileInput: boolean;
  downloadFile: (blob: Blob, fileName: string) => void;
  showSnackbar: (message: string) => void;
}

export const useDownloadController = ({
  resultState,
  currentIsFileInput,
  downloadFile,
  showSnackbar,
}: UseDownloadControllerOptions) => {
  const { t } = useTranslation();

  const handleDownload = useCallback(async () => {
    if (!resultState.translationResult) {
      return;
    }

    if (
      resultState.translationResult.isError &&
      (!resultState.report || resultState.report.success === 0)
    ) {
      return;
    }

    try {
      if (!currentIsFileInput) {
        showSnackbar(t('downloadController.fileOnlySupported'));
        return;
      }

      if (resultState.singleFileBlob && resultState.singleFileName) {
        downloadFile(resultState.singleFileBlob, resultState.singleFileName);
        return;
      }

      if (resultState.zipBlob) {
        downloadFile(resultState.zipBlob, 'translated_files.zip');
        return;
      }

      showSnackbar(t('downloadController.noFileToDownload'));
    } catch (error) {
      console.error('다운로드 오류:', error);
      showSnackbar(t('downloadController.downloadError'));
    }
  }, [
    resultState.translationResult,
    resultState.report,
    resultState.singleFileBlob,
    resultState.singleFileName,
    resultState.zipBlob,
    currentIsFileInput,
    downloadFile,
    showSnackbar,
    t,
  ]);

  const shouldShowDownloadButton = useMemo(() => currentIsFileInput, [currentIsFileInput]);

  return { handleDownload, shouldShowDownloadButton } as const;
};
