import React from 'react';
import { Button, Stack, Typography } from '@mui/material';
import type { ButtonProps } from '@mui/material/Button';
import i18n from '../config/i18n';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { DetailModal } from '../components/common/DetailModal';
import { TranslationHistoryModal } from '../components/CacheManagerPanel/TranslationHistoryModal';
import { TranslationDetailModal } from '../components/CacheManagerPanel/TranslationDetailModal';
import { CacheTagDeleteModal } from '../components/CacheTagView/CacheTagDeleteModal';
import { LogDetailContent } from '../views/LogView/components/LogDetailContent';
import type { ModalRegistry } from './modalTypes';

const ALERT_VARIANT_COLOR_MAP: Record<'info' | 'warning' | 'danger', ButtonProps['color']> = {
  info: 'primary',
  warning: 'warning',
  danger: 'error',
};

export const modalDefinitions: ModalRegistry = {
  'ui.alert': {
    render: (payload, context) => {
      const variant = payload.variant ?? 'info';
      return (
        <Stack spacing={3} sx={{ minWidth: { xs: 0, sm: 320 } }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {payload.message}
          </Typography>
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              color={ALERT_VARIANT_COLOR_MAP[variant] ?? 'primary'}
              onClick={() => {
                context.close();
              }}
              sx={{ fontWeight: 600, minWidth: 96 }}
            >
              {payload.confirmText ?? i18n.t('modal.confirm')}
            </Button>
          </Stack>
        </Stack>
      );
    },
    defaultFrameOptions: {
      title: i18n.t('modal.notification'),
      className: 'alert-modal',
      size: 'small',
      showCloseButton: true,
      closeOnEscape: true,
      closeOnOutsideClick: true,
    },
  },
  'ui.confirm': {
    render: (payload) => (
      <ConfirmModal
        message={payload.message}
        confirmText={payload.confirmText}
        cancelText={payload.cancelText}
        variant={payload.variant}
        onConfirm={payload.onConfirm}
        onCancel={payload.onCancel}
      />
    ),
    defaultFrameOptions: {
      title: i18n.t('modal.confirm'),
      size: 'small',
      className: 'confirm-modal',
      showCloseButton: false,
      closeOnEscape: true,
      closeOnOutsideClick: false,
    },
  },
  'ui.detail': {
    render: (payload) => <DetailModal className={payload.className}>{payload.content}</DetailModal>,
    defaultFrameOptions: {
      size: 'medium',
      className: 'detail-modal',
      showCloseButton: true,
      closeOnEscape: true,
      closeOnOutsideClick: true,
    },
  },
  'cache.translationHistory': {
    render: (payload) => (
      <TranslationHistoryModal translationHistory={payload.translationHistory} />
    ),
    defaultFrameOptions: {
      title: i18n.t('modal.translationHistory'),
      size: 'medium',
      className: 'translation-history-modal',
      showCloseButton: true,
      closeOnEscape: true,
      closeOnOutsideClick: true,
    },
  },
  'cache.translationDetail': {
    render: (payload) => (
      <TranslationDetailModal
        translation={payload.translation}
        onHistoryClick={payload.onHistoryClick}
        onSave={payload.onSave}
        cacheTags={payload.cacheTags}
        onChangeCacheTag={payload.onChangeCacheTag}
        isProcessing={payload.isProcessing}
      />
    ),
    defaultFrameOptions: {
      title: i18n.t('modal.translationDetail'),
      size: 'large',
      className: 'translation-detail-modal',
      closeOnEscape: true,
      closeOnOutsideClick: false,
      showCloseButton: true,
    },
  },
  'cache.deleteTag': {
    render: (payload, context) => (
      <CacheTagDeleteModal
        tag={payload.tag}
        cacheTags={payload.cacheTags}
        onSubmit={payload.onSubmit}
        onClose={context.close}
      />
    ),
    defaultFrameOptions: {
      title: i18n.t('cacheTag.deleteCacheTag'),
      size: 'small',
      className: 'cache-tag-delete-modal',
      showCloseButton: true,
      closeOnEscape: true,
      closeOnOutsideClick: false,
    },
  },
  'log.detail': {
    render: (payload) => (
      <LogDetailContent
        log={payload.log}
        isLoading={payload.isLoading}
        error={payload.error}
        onRetry={payload.onRetry}
      />
    ),
    defaultFrameOptions: {
      title: i18n.t('modal.logDetail'),
      size: 'large',
      className: 'log-detail-modal',
      showCloseButton: true,
      closeOnEscape: true,
      closeOnOutsideClick: true,
    },
  },
};

export default modalDefinitions;
