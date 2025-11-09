import React, { useCallback, useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, Button, Snackbar, Alert } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import { IpcChannel } from '@apps/common/dist/ipc/ipc-channel';
import { useSnackbar } from '@/react/hooks/useSnackbar';
import { ipcClient } from '@/react/ipc/ipcClient';
import { useTranslation } from 'react-i18next';

const ImageViewerView: React.FC = () => {
  const { t } = useTranslation();
  const LAST_ZIP_KEY = 'last_viewer_zip_path';
  const [lastZipPath] = useState<string | null>(() => localStorage.getItem(LAST_ZIP_KEY));
  const [viewerWindowId, setViewerWindowId] = useState<number | null>(null);
  const { isOpen, message, showSnackbar, closeSnackbar } = useSnackbar();

  const openViewer = useCallback(async () => {
    const res = await ipcClient.invoke(IpcChannel.OpenAdvancedImageViewer, {});
    if ((res as { success?: boolean; windowId?: number })?.success) {
      setViewerWindowId((res as { windowId?: number }).windowId ?? null);
    }
    return res as { success: boolean; windowId?: number };
  }, []);

  const forwardZipFile = useCallback(
    async (file: File) => {
      try {
        showSnackbar(t('imageViewer.preparingToOpen'));
        const openRes = await openViewer();
        if (!openRes?.success) {
          showSnackbar(t('imageViewer.openFailed'));
          return;
        }
        const winId = (openRes as { windowId?: number }).windowId as number | undefined;
        const filePath = (file as unknown as { path?: string }).path;
        if (filePath) {
          await ipcClient.invoke(IpcChannel.AdvancedViewerLoadZip, {
            zipPath: filePath,
            name: file.name,
            windowId: winId ?? viewerWindowId ?? undefined,
          });
          localStorage.setItem('last_viewer_zip_path', filePath);
          showSnackbar(`${t('imageViewer.opened')}: ${file.name}`);
        } else {
          const buf = await file.arrayBuffer();
          await ipcClient.invoke(IpcChannel.AdvancedViewerLoadZip, {
            zipBuffer: buf,
            name: file.name,
            windowId: winId ?? viewerWindowId ?? undefined,
          });
          showSnackbar(`${t('imageViewer.openedMemory')}: ${file.name}`);
        }
      } catch (e) {
        showSnackbar(`${t('imageViewer.failed')}: ${(e as Error)?.message}`);
      }
    },
    [openViewer, viewerWindowId, showSnackbar, t]
  );

  const handleOpenViaDialog = useCallback(async () => {
    try {
      showSnackbar(t('imageViewer.selecting'));
      const res = await ipcClient.invoke(IpcChannel.OpenZipInAdvancedViewerDialog, {});
      if ((res as { success?: boolean })?.success) {
        showSnackbar(t('imageViewer.zipLoadComplete'));
      } else {
        const msg = (res as { message?: string })?.message;
        if (msg === '취소됨') showSnackbar(t('imageViewer.cancelled'));
        else showSnackbar(`${t('imageViewer.failed')}: ${msg || t('imageViewer.unknownError')}`);
      }
    } catch (e) {
      showSnackbar(`${t('imageViewer.failed')}: ${(e as Error)?.message}`);
    }
  }, [showSnackbar, t]);

  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file && (file.type === 'application/zip' || file.name.endsWith('.zip'))) {
        forwardZipFile(file);
      }
    };
    const onPaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0];
      if (file && (file.type === 'application/zip' || file.name.endsWith('.zip'))) {
        forwardZipFile(file);
      }
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    window.addEventListener('paste', onPaste as unknown as EventListener);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('paste', onPaste as unknown as EventListener);
    };
  }, [forwardZipFile]);

  return (
    <>
      <Paper elevation={0} sx={{ p: 2, borderRadius: '12px' }}>
        <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <Button variant="contained" startIcon={<UploadIcon />} onClick={handleOpenViaDialog}>
            {t('imageViewer.openZip')}
          </Button>
          <Typography color="text.secondary" textAlign="center">
            {t('imageViewer.openZipDescription')}
          </Typography>
          {lastZipPath && (
            <Typography variant="caption" color="text.secondary">
              {t('imageViewer.recent')}: {lastZipPath}
            </Typography>
          )}
          <Box
            sx={{
              mt: 2,
              width: '100%',
              border: '1px dashed',
              borderColor: 'divider',
              p: 4,
              textAlign: 'center',
              borderRadius: 2,
              color: 'text.secondary',
            }}
          >
            {t('imageViewer.dropzone')}
          </Box>
        </Stack>
      </Paper>
      <Snackbar
        open={isOpen}
        onClose={closeSnackbar}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity="info" variant="filled" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ImageViewerView;
