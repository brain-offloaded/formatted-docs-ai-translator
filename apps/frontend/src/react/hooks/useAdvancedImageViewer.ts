import { useCallback } from 'react';
import { IpcChannel } from '@apps/common/dist/ipc/ipc-channel';
import { ipcClient } from '@/react/ipc/ipcClient';
import { useTranslation } from '../contexts/TranslationContext';
import { useTranslation as useI18n } from 'react-i18next';

export const useAdvancedImageViewer = () => {
  const { showSnackbar } = useTranslation();
  const { t } = useI18n();

  const openInAdvancedViewer = useCallback(
    async (zipBlob: Blob | null) => {
      if (!zipBlob) {
        showSnackbar(t('advancedViewer.noZip'));
        return;
      }

      try {
        const openRes = await ipcClient.invoke(IpcChannel.OpenAdvancedImageViewer, {});
        if (!(openRes as { success?: boolean })?.success) {
          showSnackbar(t('advancedViewer.openFailed'));
          return;
        }

        const windowId = (openRes as { windowId?: number }).windowId;

        const buf = await zipBlob.arrayBuffer();
        await ipcClient.invoke(IpcChannel.AdvancedViewerLoadZip, {
          zipBuffer: buf,
          name: 'translated_images.zip',
          windowId,
        });

        showSnackbar(t('advancedViewer.checkResult'));
      } catch (error) {
        console.error('고급 뷰어 열기 오류:', error);
        showSnackbar(t('advancedViewer.openError'));
      }
    },
    [showSnackbar, t]
  );

  return { openInAdvancedViewer };
};
