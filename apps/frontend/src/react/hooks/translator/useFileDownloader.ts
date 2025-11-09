import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useFileDownloader = (showSnackbar: (message: string) => void) => {
  const { t } = useTranslation();

  return useCallback(
    (blob: Blob, fileName: string) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      showSnackbar(t('fileDownloader.downloadStarted', { fileName }));
    },
    [showSnackbar, t]
  );
};
