import { useCallback } from 'react';
import type { RefObject } from 'react';
import { CacheSearchType } from '@apps/common/dist/types/common';
import type { CacheSearchParams } from './cacheManager.types';

type SearchStateBase = {
  itemsPerPage: number;
  searchParams: CacheSearchParams;
  currentPage?: number;
  isLoading?: boolean;
};

interface SearchDeps<State extends SearchStateBase> {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  clearCheckedItems: () => void;
  closeAllModals: () => void;
  loadTranslations: (
    page?: number,
    itemsPerPage?: number,
    searchParams?: CacheSearchParams
  ) => void;
  searchButtonRef: RefObject<HTMLButtonElement | null>;
}

export function useCacheSearch<State extends SearchStateBase>(deps: SearchDeps<State>) {
  const { state, setState, clearCheckedItems, closeAllModals, loadTranslations, searchButtonRef } =
    deps;

  const animateSearchButton = () => {
    const searchButton = searchButtonRef.current;
    if (!searchButton) return;

    searchButton.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }],
      { duration: 300, iterations: 1 }
    );
  };

  const handleSearchParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'searchType') {
      setState((prev) => ({
        ...prev,
        searchParams: {
          ...prev.searchParams,
          searchType: value as CacheSearchType,
          searchValue: '',
        },
      }));
      animateSearchButton();
      return;
    }

    setState((prev) => ({
      ...prev,
      searchParams: { ...prev.searchParams, [name]: value as string },
    }));
    animateSearchButton();
  };

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    dateType: 'startDate' | 'endDate'
  ) => {
    const value = e.target.value;
    const formattedDate = value ? value.replace(/-/g, '/') : '';
    setState((prev) => ({
      ...prev,
      searchParams: { ...prev.searchParams, [dateType]: formattedDate },
    }));
    animateSearchButton();
  };

  const handleSearch = useCallback(() => {
    clearCheckedItems();
    closeAllModals();
    setState((prev) => ({ ...prev, currentPage: 1, isLoading: true }));
    loadTranslations(1, state.itemsPerPage, state.searchParams);
  }, [
    clearCheckedItems,
    closeAllModals,
    loadTranslations,
    setState,
    state.itemsPerPage,
    state.searchParams,
  ]);

  return {
    handleSearchParamChange,
    handleDateChange,
    handleSearch,
    searchButtonRef,
  } as const;
}
