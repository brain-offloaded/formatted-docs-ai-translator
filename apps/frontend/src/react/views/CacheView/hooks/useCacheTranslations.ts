import { useCallback } from 'react';
import { CacheTranslationsService } from '@/react/api/generated';
import type { CacheState } from './cacheManager.types';

interface UseCacheTranslationsParams {
  state: CacheState;
  setState: React.Dispatch<React.SetStateAction<CacheState>>;
}

export const useCacheTranslations = ({ state, setState }: UseCacheTranslationsParams) => {
  const loadTranslations = useCallback(
    async (
      page = state.currentPage,
      itemsPerPage = state.itemsPerPage,
      searchParams = state.searchParams
    ) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const response = await CacheTranslationsService.cacheTranslationsControllerGetTranslations({
          page,
          itemsPerPage,
          searchType: searchParams.searchType,
          searchValue: searchParams.searchValue,
          startDate: searchParams.startDate,
          endDate: searchParams.endDate,
        });

        if (!response.success) {
          throw new Error(response.message ?? '번역 목록 조회에 실패했습니다.');
        }

        const translations = Array.isArray(response.translations) ? response.translations : [];
        const totalItems = Number.isFinite(response.totalItems)
          ? response.totalItems
          : translations.length;

        setState((prev) => ({
          ...prev,
          translations,
          totalItems,
          isLoading: false,
        }));
      } catch (error) {
        console.warn('[Cache] Failed to load translations:', error);
        setState((prev) => ({ ...prev, translations: [], totalItems: 0, isLoading: false }));
      }
    },
    [setState, state.currentPage, state.itemsPerPage, state.searchParams]
  );

  const refreshTranslations = useCallback(() => loadTranslations(), [loadTranslations]);

  return { loadTranslations, refreshTranslations };
};
