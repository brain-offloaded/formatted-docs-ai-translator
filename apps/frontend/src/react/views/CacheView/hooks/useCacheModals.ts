import { useCallback, useMemo, useState } from 'react';
import { openAlertModal } from '../../../utils/modalUtils';
import { CacheTranslationsService } from '@/react/api/generated';
import { createModalId } from '../../../contexts/ModalContext';
import type { OpenModalFn, CloseModalFn } from '../../../contexts/ModalContext';
import type { CacheState } from './cacheManager.types';
import i18n from '@/react/config/i18n';

interface UseCacheModalsParams {
  state: CacheState;
  setState: React.Dispatch<React.SetStateAction<CacheState>>;
  openModal: OpenModalFn;
  closeModal: CloseModalFn;
  refreshTranslations: () => Promise<void>;
  refreshCacheTags: () => Promise<void>;
}

export function useCacheModals({
  state,
  setState,
  openModal,
  closeModal,
  refreshTranslations,
  refreshCacheTags,
}: UseCacheModalsParams) {
  const [currentDetailModalId, setCurrentDetailModalId] = useState<string | null>(null);
  const [currentHistoryModalId, setCurrentHistoryModalId] = useState<string | null>(null);

  const historyModalId = useMemo(() => createModalId('cache.translationHistory', 'current'), []);
  const detailModalIdFor = useCallback(
    (translationId: number) => createModalId('cache.translationDetail', String(translationId)),
    []
  );

  const closeAllModals = useCallback(() => {
    if (currentDetailModalId) {
      closeModal(currentDetailModalId);
      setCurrentDetailModalId(null);
    }
    if (currentHistoryModalId) {
      closeModal(currentHistoryModalId);
      setCurrentHistoryModalId(null);
    }
  }, [closeModal, currentDetailModalId, currentHistoryModalId]);

  const loadAndShowHistory = useCallback(
    async (translationId: number) => {
      try {
        const response =
          await CacheTranslationsService.cacheTranslationsControllerGetTranslationHistory({
            translationId,
          });

        if (response.success) {
          const translationHistory = Array.isArray(response.translationHistory)
            ? response.translationHistory
            : [];
          setState((prev) => ({
            ...prev,
            translationHistory,
            selectedTranslationId: translationId,
          }));

          if (currentHistoryModalId) {
            closeModal(currentHistoryModalId);
          }

          openModal({
            id: historyModalId,
            type: 'cache.translationHistory',
            payload: {
              translationHistory,
            },
            frameOptions: {
              onClose: () => setCurrentHistoryModalId(null),
            },
          });
          setCurrentHistoryModalId(historyModalId);
          return;
        }

        const fallbackMessage = response.message ?? '번역 이력을 불러오지 못했습니다.';
        throw new Error(fallbackMessage);
      } catch (error) {
        console.error('번역 이력 로드 실패:', error);
        openAlertModal(
          { title: '오류', message: '번역 이력을 불러오는 중 오류가 발생했습니다.' },
          openModal
        );
      }
    },
    [closeModal, currentHistoryModalId, historyModalId, openModal, setState]
  );

  const updateTranslation = useCallback(
    async (translationId: number, newTarget: string) => {
      if (!translationId) {
        openAlertModal({ title: '오류', message: '선택된 번역이 없습니다.' }, openModal);
        return;
      }
      try {
        setState((prev) => ({ ...prev, isLoading: true }));
        const response =
          await CacheTranslationsService.cacheTranslationsControllerUpdateTranslation({
            translationId,
            requestBody: { target: newTarget },
          });

        if (response.success) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            selectedTranslationId: translationId,
            translations: prev.translations.map((t) =>
              t.id === translationId ? { ...t, target: newTarget } : t
            ),
          }));
          openAlertModal({ title: '성공', message: '번역이 저장되었습니다.' }, openModal);
          await refreshTranslations();
          return;
        }
        throw new Error(response.message ?? '번역 업데이트에 실패했습니다.');
      } catch (error) {
        console.error('번역 업데이트 실패:', error);
        openAlertModal(
          { title: '오류', message: '번역 업데이트 중 오류가 발생했습니다.' },
          openModal
        );
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [openModal, refreshTranslations, setState]
  );

  const changeTranslationCacheTag = useCallback(
    async (translationId: number, cacheTagId: number) => {
      if (!translationId) {
        openAlertModal(
          { title: '오류', message: i18n.t('cacheManager.cacheTagChangeFailed') },
          openModal
        );
        return;
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true }));
        const response =
          await CacheTranslationsService.cacheTranslationsControllerUpdateTranslationCacheTag({
            translationId,
            requestBody: { cacheTagId },
          });

        if (response.success) {
          const targetTag = state.cacheTags.find((tag) => tag.id === cacheTagId);
          setState((prev) => ({
            ...prev,
            isLoading: false,
            translations: prev.translations.map((translation) =>
              translation.id === translationId
                ? {
                    ...translation,
                    cacheTag: targetTag?.name ?? translation.cacheTag,
                    cacheTagId,
                  }
                : translation
            ),
          }));
          openAlertModal(
            { title: '성공', message: i18n.t('cacheManager.cacheTagChangeSuccess') },
            openModal
          );
          await refreshTranslations();
          await refreshCacheTags();
          return;
        }

        const fallbackMessage = response.message ?? i18n.t('cacheManager.cacheTagChangeFailed');
        throw new Error(fallbackMessage);
      } catch (error) {
        console.error('캐시 태그 변경 실패:', error);
        openAlertModal(
          { title: '오류', message: i18n.t('cacheManager.cacheTagChangeFailed') },
          openModal
        );
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [openModal, refreshCacheTags, refreshTranslations, setState, state.cacheTags]
  );

  const showDetailModal = useCallback(
    (translationId: number) => {
      const translation = state.translations.find((t) => t.id === translationId) || null;
      setState((prev) => ({ ...prev, selectedTranslationId: translationId }));

      if (currentDetailModalId) closeModal(currentDetailModalId);

      const detailModalId = detailModalIdFor(translationId);

      openModal({
        id: detailModalId,
        type: 'cache.translationDetail',
        payload: {
          translation,
          onHistoryClick: loadAndShowHistory,
          onSave: (newTarget: string) => updateTranslation(translationId, newTarget),
          cacheTags: state.cacheTags,
          onChangeCacheTag: (nextCacheTagId: number) =>
            changeTranslationCacheTag(translationId, nextCacheTagId),
          isProcessing: state.isLoading,
        },
        frameOptions: {
          onClose: () => setCurrentDetailModalId(null),
        },
      });
      setCurrentDetailModalId(detailModalId);
    },
    [
      closeModal,
      currentDetailModalId,
      loadAndShowHistory,
      openModal,
      detailModalIdFor,
      setState,
      state.translations,
      changeTranslationCacheTag,
      state.cacheTags,
      state.isLoading,
      updateTranslation,
    ]
  );

  return {
    closeAllModals,
    showDetailModal,
  };
}
