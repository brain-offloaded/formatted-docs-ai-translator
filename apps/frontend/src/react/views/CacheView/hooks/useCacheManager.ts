import { useCallback, useEffect, useRef, useState } from 'react';
import { useCheckboxes } from '../../../hooks/useCheckboxes';
import { useModal } from '../../../contexts/ModalContext';
import { useConfirmModal } from '../../../components/common/ConfirmModal';
import { useCachePagination } from './useCachePagination';
import { useCacheSearch } from './useCacheSearch';
import { useCacheExportImport } from './useCacheExportImport';
import { createInitialCacheState } from './cacheManager.types';
import { useCacheTranslations } from './useCacheTranslations';
import { useCacheModals } from './useCacheModals';
import { useCacheDeletionActions } from './useCacheDeletionActions';
import type { CacheTranslationDto } from '@/react/api/generated';
import type { CacheState } from './cacheManager.types';
import { CacheTagsService } from '@/react/api/generated';

export const useCacheManager = () => {
  const [state, setState] = useState<CacheState>(() => createInitialCacheState());
  const { openModal, closeModal } = useModal();
  const { openConfirmModal } = useConfirmModal();

  const { checkedItems, handleCheckboxChange, handleCheckAll, clearCheckedItems } =
    useCheckboxes<CacheTranslationDto>({
      idExtractor: (t) => t.id,
    });

  const { loadTranslations, refreshTranslations } = useCacheTranslations({ state, setState });

  const loadCacheTags = useCallback(async () => {
    try {
      const response = await CacheTagsService.cacheTagsControllerGetCacheTags({});
      if (!response.success) {
        throw new Error(response.message ?? '캐시 태그를 불러오는 중 오류가 발생했습니다.');
      }

      const tags = Array.isArray(response.cacheTags) ? response.cacheTags : [];
      setState((prev) => ({ ...prev, cacheTags: tags }));
    } catch (error) {
      console.warn('[Cache] 캐시 태그를 불러오지 못했습니다:', error);
    }
  }, [setState]);

  const refreshTranslationsWithTags = useCallback(async () => {
    await refreshTranslations();
    await loadCacheTags();
  }, [refreshTranslations, loadCacheTags]);

  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!isInitialLoadRef.current) return;
    isInitialLoadRef.current = false;
    void refreshTranslationsWithTags();
  }, [refreshTranslationsWithTags]);

  const { closeAllModals, showDetailModal } = useCacheModals({
    state,
    setState,
    openModal,
    closeModal,
    refreshTranslations: refreshTranslationsWithTags,
    refreshCacheTags: loadCacheTags,
  });

  const { deleteCheckedItems, deleteAllItems } = useCacheDeletionActions({
    state,
    checkedItems,
    clearCheckedItems,
    refreshTranslations: refreshTranslationsWithTags,
    openModal,
    closeAllModals,
    openConfirmModal,
  });

  const pagination = useCachePagination({ state, setState, clearCheckedItems, loadTranslations });
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);
  const search = useCacheSearch({
    state,
    setState,
    clearCheckedItems,
    closeAllModals,
    loadTranslations,
    searchButtonRef,
  });

  const { renderExportImportButtons } = useCacheExportImport({
    searchParams: state.searchParams,
    openModal,
    loadTranslations: () => {
      void refreshTranslationsWithTags();
    },
  });

  return {
    state,
    setState,
    checkedItems,
    handleCheckboxChange,
    handleCheckAll,
    clearCheckedItems,
    loadTranslations,
    refreshTranslations: refreshTranslationsWithTags,
    showDetailModal,
    deleteCheckedItems,
    deleteAllItems,
    handleCustomItemsPerPageChange: pagination.handleCustomItemsPerPageChange,
    applyCustomItemsPerPage: pagination.applyCustomItemsPerPage,
    handleCustomItemsPerPageKeyDown: pagination.handleCustomItemsPerPageKeyDown,
    handleSearchParamChange: search.handleSearchParamChange,
    closeAllModals,
    handleSearch: search.handleSearch,
    handleDateChange: search.handleDateChange,
    handlePageChange: pagination.handlePageChange,
    handleItemsPerPageChange: pagination.handleItemsPerPageChange,
    renderExportImportButtons,
    searchButtonRef,
    refreshCacheTags: loadCacheTags,
  } as const;
};

export type UseCacheManagerReturn = ReturnType<typeof useCacheManager>;
