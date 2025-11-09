import React, { useCallback, useMemo } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';

import {
  isFileSystemAccessSupported,
  pickZipFileNative,
  saveZipFileNative,
  TempFileCache,
} from '../../utils/fileSystemAccess';
import { TranslationResultState } from '../../contexts/TranslationContext';
import { useSnackbar } from '../../hooks/useSnackbar';
import { useTranslation } from 'react-i18next';

interface ImageFileHandlerProps {
  resultState: TranslationResultState;
  onFileSelect: (file: File) => void;
  onViewInAdvancedViewer: () => void;
}

export const ImageFileHandler: React.FC<ImageFileHandlerProps> = ({
  resultState,
  onFileSelect,
  onViewInAdvancedViewer,
}) => {
  const { showSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const tempCache = useMemo(() => new TempFileCache(), []);

  // File System Access API 지원 여부 확인
  const isNativeFileAccessSupported = useMemo(() => {
    return isFileSystemAccessSupported();
  }, []);

  /**
   * 네이티브 파일 선택기를 사용한 ZIP 파일 선택
   */
  const handlePickZipNative = useCallback(async () => {
    if (!isNativeFileAccessSupported) {
      showSnackbar(t('imageTranslation.fileApiNotSupportedPicker'));
      return;
    }

    try {
      const file = await pickZipFileNative();
      if (file) {
        onFileSelect(file);
        showSnackbar(t('imageTranslation.fileSelected', { fileName: file.name }));
      }
    } catch (error) {
      console.error('파일 선택 오류:', error);
      showSnackbar(t('imageTranslation.fileSelectError'));
    }
  }, [isNativeFileAccessSupported, onFileSelect, showSnackbar, t]);

  /**
   * 네이티브 파일 저장기를 사용한 ZIP 파일 저장
   */
  const handleSaveZipNative = useCallback(async () => {
    if (!resultState.zipBlob) {
      showSnackbar(t('imageTranslation.noZipToSave'));
      return;
    }

    if (!isNativeFileAccessSupported) {
      showSnackbar(t('imageTranslation.fileApiNotSupportedDownload'));
      return;
    }

    try {
      const success = await saveZipFileNative(resultState.zipBlob, 'translated_images.zip');
      if (success) {
        showSnackbar(t('imageTranslation.saveSuccess'));
      }
    } catch (error) {
      console.error('파일 저장 오류:', error);
      showSnackbar(t('imageTranslation.saveError'));
    }
  }, [resultState.zipBlob, isNativeFileAccessSupported, showSnackbar, t]);

  /**
   * 대용량 파일을 임시 캐시에 저장
   */
  const handleCacheLargeFile = useCallback(async () => {
    if (!resultState.zipBlob) {
      showSnackbar(t('imageTranslation.noCacheFile'));
      return;
    }

    try {
      await tempCache.init();
      const cacheKey = `translated_images_${Date.now()}`;
      await tempCache.storeFile(cacheKey, resultState.zipBlob);
      showSnackbar(t('imageTranslation.cacheSuccess'));

      // 캐시 키를 로컬 스토리지에 저장 (나중에 복구용)
      localStorage.setItem('cached_zip_key', cacheKey);
    } catch (error) {
      console.error('캐시 저장 오류:', error);
      showSnackbar(t('imageTranslation.cacheError'));
    }
  }, [resultState.zipBlob, tempCache, showSnackbar, t]);

  /**
   * 캐시된 파일 복구
   */
  const handleRestoreFromCache = useCallback(async () => {
    const cacheKey = localStorage.getItem('cached_zip_key');
    if (!cacheKey) {
      showSnackbar(t('imageTranslation.noCachedFile'));
      return;
    }

    try {
      await tempCache.init();
      const blob = await tempCache.getFile(cacheKey);
      if (blob) {
        // 고급 뷰어로 바로 전송 (IPC 오버헤드 없이)
        const file = new File([blob], 'cached_translated_images.zip', { type: 'application/zip' });
        onFileSelect(file);
        showSnackbar(t('imageTranslation.restoreSuccess'));
      } else {
        showSnackbar(t('imageTranslation.restoreNotFound'));
      }
    } catch (error) {
      console.error('캐시 복구 오류:', error);
      showSnackbar(t('imageTranslation.restoreError'));
    }
  }, [tempCache, onFileSelect, showSnackbar, t]);

  return (
    <Box sx={{ p: 2 }}>
      {isNativeFileAccessSupported && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('imageTranslation.fileApiInfo')}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        {isNativeFileAccessSupported && (
          <>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={handlePickZipNative}
              color="primary"
            >
              {t('imageTranslation.pickZipNative')}
            </Button>

            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleSaveZipNative}
              disabled={!resultState.zipBlob}
              color="secondary"
            >
              {t('imageTranslation.saveZipNative')}
            </Button>
          </>
        )}

        <Button variant="outlined" onClick={handleCacheLargeFile} disabled={!resultState.zipBlob}>
          {t('imageTranslation.cacheToTemp')}
        </Button>

        <Button variant="outlined" onClick={handleRestoreFromCache}>
          {t('imageTranslation.restoreFromCache')}
        </Button>

        <Button
          variant="contained"
          startIcon={<VisibilityIcon />}
          onClick={onViewInAdvancedViewer}
          disabled={!resultState.zipBlob}
        >
          {t('imageTranslation.viewAdvanced')}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary">
        {isNativeFileAccessSupported
          ? t('imageTranslation.fileApiSupported')
          : t('imageTranslation.fileApiNotSupported')}
      </Typography>
    </Box>
  );
};
