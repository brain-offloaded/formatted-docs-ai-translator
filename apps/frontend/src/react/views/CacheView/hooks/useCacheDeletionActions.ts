import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { openAlertModal } from '../../../utils/modalUtils';
import type { OpenModalFn } from '../../../contexts/ModalContext';
import type { ConfirmModalProps } from '../../../components/common/ConfirmModal';
import type { CacheState } from './cacheManager.types';
import { CacheTranslationsService } from '@/react/api/generated';
import type { CacheTranslationsSearchParamsDto } from '@/react/api/generated';

interface UseCacheDeletionActionsParams {
  state: CacheState;
  checkedItems: Set<number>;
  clearCheckedItems: () => void;
  refreshTranslations: () => Promise<void>;
  openModal: OpenModalFn;
  closeAllModals: () => void;
  openConfirmModal: (options: ConfirmModalProps) => string;
}

export function useCacheDeletionActions({
  state,
  checkedItems,
  clearCheckedItems,
  refreshTranslations,
  openModal,
  closeAllModals,
  openConfirmModal,
}: UseCacheDeletionActionsParams) {
  const { t } = useTranslation();

  const deleteCheckedItems = useCallback(() => {
    if (checkedItems.size === 0) return;
    openConfirmModal({
      title: t('cache.deleteSelected'),
      message: t('cache.deleteConfirmMessage', { count: checkedItems.size }),
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response =
            await CacheTranslationsService.cacheTranslationsControllerDeleteTranslations({
              requestBody: { translationIds: Array.from(checkedItems) },
            });

          if (!response.success) {
            throw new Error(response.message ?? t('cache.deleteFailed'));
          }

          clearCheckedItems();
          closeAllModals();
          await refreshTranslations();
          openAlertModal({ title: t('common.success'), message: t('cache.deleted') }, openModal);
          return;
        } catch (error) {
          console.error('항목 삭제 실패:', error);
          openAlertModal({ title: t('common.error'), message: t('cache.deleteError') }, openModal);
        }
      },
    });
  }, [
    checkedItems,
    clearCheckedItems,
    closeAllModals,
    openConfirmModal,
    openModal,
    refreshTranslations,
    t,
  ]);

  const deleteAllItems = useCallback(() => {
    openConfirmModal({
      title: t('cache.deleteAllTitle'),
      message: t('cache.deleteAllConfirmMessage'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response =
            await CacheTranslationsService.cacheTranslationsControllerDeleteTranslations({
              requestBody: {
                searchParams: {
                  searchType: state.searchParams
                    .searchType as unknown as CacheTranslationsSearchParamsDto['searchType'],
                  searchValue: state.searchParams.searchValue,
                  startDate: state.searchParams.startDate,
                  endDate: state.searchParams.endDate,
                },
              },
            });

          if (!response.success) {
            throw new Error(response.message ?? t('cache.deleteAllFailed'));
          }

          clearCheckedItems();
          closeAllModals();
          await refreshTranslations();
          openAlertModal(
            { title: t('common.success'), message: t('cache.deleteAllSuccess') },
            openModal
          );
          return;
        } catch (error) {
          console.error('전체 삭제 실패:', error);
          openAlertModal(
            { title: t('common.error'), message: t('cache.deleteAllError') },
            openModal
          );
        }
      },
    });
  }, [
    clearCheckedItems,
    closeAllModals,
    openModal,
    openConfirmModal,
    refreshTranslations,
    state.searchParams,
    t,
  ]);

  return { deleteCheckedItems, deleteAllItems };
}
