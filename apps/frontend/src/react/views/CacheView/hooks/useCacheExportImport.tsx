import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, CircularProgress, Typography } from '@mui/material';
import { Download as DownloadIcon, Upload as UploadIcon } from '@mui/icons-material';
import { CacheSearchType } from '@apps/common/dist/types/common';
import type { CacheSearchParams } from './cacheManager.types';
import { openAlertModal } from '../../../utils/modalUtils';
import type { OpenModalFn } from '../../../contexts/ModalContext';
import { CacheTranslationsService } from '@/react/api/generated';

interface ExportImportDeps {
  searchParams: CacheSearchParams;
  openModal: OpenModalFn;
  loadTranslations: () => void;
}

export function useCacheExportImport({
  searchParams,
  openModal,
  loadTranslations,
}: ExportImportDeps) {
  const { t } = useTranslation();
  const [isImporting, setIsImporting] = useState(false);

  const handleExportTranslations = useCallback(async () => {
    try {
      const response = await CacheTranslationsService.cacheTranslationsControllerExportTranslations(
        {
          searchType: searchParams.searchType,
          searchValue: searchParams.searchValue,
          startDate: searchParams.startDate,
          endDate: searchParams.endDate,
        }
      );

      if (!response.success || !response.translations) {
        throw new Error(response.message ?? t('cacheExportImport.exportErrorMessage'));
      }

      const blob = new Blob([JSON.stringify(response.translations, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      let fileName = `translations_${new Date().toISOString().split('T')[0]}`;
      if (searchParams.searchType !== CacheSearchType.DATE && searchParams.searchValue) {
        const searchValue = searchParams.searchValue
          .replace(/[^a-zA-Z0-9가-힣]/g, '_')
          .substring(0, 30);
        fileName += `_${searchParams.searchType}_${searchValue}`;
      }
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      openAlertModal(
        {
          title: t('cacheExportImport.exportSuccessTitle'),
          message: t('cacheExportImport.exportSuccessMessage'),
        },
        openModal
      );
    } catch (error) {
      console.error(t('cacheExportImport.exportErrorLog'), error);
      const message =
        error instanceof Error ? error.message : t('cacheExportImport.exportErrorMessage');
      openAlertModal({ title: t('cacheExportImport.errorTitle'), message }, openModal);
    }
  }, [openModal, searchParams, t]);

  const handleImportTranslations = useCallback(async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
          const fileContent = await file.text();
          const translations = JSON.parse(fileContent);
          const response =
            await CacheTranslationsService.cacheTranslationsControllerImportTranslations({
              requestBody: { translations },
            });

          if (response.success) {
            openAlertModal(
              {
                title: t('cacheExportImport.exportSuccessTitle'),
                message: t('cacheExportImport.importSuccessMessage', {
                  updatedCount: response.updatedCount,
                }),
              },
              openModal
            );
            loadTranslations();
          } else {
            const message = response.message || t('cacheExportImport.importErrorMessage');
            openAlertModal(
              {
                title: t('cacheExportImport.errorTitle'),
                message,
              },
              openModal
            );
          }
        } catch (err) {
          console.error(t('cacheExportImport.fileProcessErrorLog'), err);
          openAlertModal(
            {
              title: t('cacheExportImport.errorTitle'),
              message: t('cacheExportImport.fileProcessErrorMessage'),
            },
            openModal
          );
        } finally {
          setIsImporting(false);
        }
      };
      input.click();
    } catch (error) {
      console.error(t('cacheExportImport.importErrorLog'), error);
      openAlertModal(
        {
          title: t('cacheExportImport.errorTitle'),
          message: t('cacheExportImport.importErrorMessage'),
        },
        openModal
      );
    }
  }, [loadTranslations, openModal, t]);

  const renderExportImportButtons = () => (
    <>
      <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportTranslations}>
        {t('cacheExportImport.exportButton')}
      </Button>
      <Button
        variant="outlined"
        startIcon={isImporting ? <CircularProgress size={18} color="inherit" /> : <UploadIcon />}
        onClick={handleImportTranslations}
        disabled={isImporting}
        aria-busy={isImporting}
      >
        {isImporting
          ? t('cacheExportImport.importInProgress')
          : t('cacheExportImport.importButton')}
      </Button>
      {isImporting && (
        <Typography variant="caption" color="text.secondary" aria-live="polite">
          {t('cacheExportImport.importInProgressDescription')}
        </Typography>
      )}
    </>
  );

  return {
    handleExportTranslations,
    handleImportTranslations,
    renderExportImportButtons,
  } as const;
}
