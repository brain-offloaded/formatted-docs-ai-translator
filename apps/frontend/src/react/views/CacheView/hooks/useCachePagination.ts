import { useCallback } from 'react';
import type { CacheSearchParams } from './cacheManager.types';

type PaginationStateBase = {
  currentPage: number;
  itemsPerPage: number;
  searchParams: CacheSearchParams;
  customItemsPerPage: string;
  isCustomPerPageMode?: boolean;
  isLoading?: boolean;
};

interface PaginationDeps<State extends PaginationStateBase> {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  clearCheckedItems: () => void;
  loadTranslations: (
    page?: number,
    itemsPerPage?: number,
    searchParams?: CacheSearchParams
  ) => void;
}

export function useCachePagination<State extends PaginationStateBase>(deps: PaginationDeps<State>) {
  const { state, setState, clearCheckedItems, loadTranslations } = deps;

  const handlePageChange = useCallback(
    (newPage: number) => {
      clearCheckedItems();
      setState((prev) => ({ ...prev, currentPage: newPage, isLoading: true }));
      loadTranslations(newPage, state.itemsPerPage, state.searchParams);
    },
    [clearCheckedItems, loadTranslations, setState, state.itemsPerPage, state.searchParams]
  );

  const handleItemsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      clearCheckedItems();
      const value = e.target.value;
      if (value === 'custom') {
        setState((prev) => ({
          ...prev,
          customItemsPerPage: prev.itemsPerPage.toString(),
          isCustomPerPageMode: true,
        }));
      } else {
        const newItemsPerPage = parseInt(value, 10);
        setState((prev) => ({
          ...prev,
          itemsPerPage: newItemsPerPage,
          currentPage: 1,
          customItemsPerPage: '',
          isCustomPerPageMode: false,
          isLoading: true,
        }));
        loadTranslations(1, newItemsPerPage, state.searchParams);
      }
    },
    [clearCheckedItems, loadTranslations, setState, state.searchParams]
  );

  const handleCustomItemsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, customItemsPerPage: e.target.value }));
  };

  const applyCustomItemsPerPage = () => {
    const customValue = parseInt(state.customItemsPerPage, 10);
    if (!isNaN(customValue) && customValue > 0) {
      setState((prev) => ({
        ...prev,
        itemsPerPage: customValue,
        currentPage: 1,
        isLoading: true,
      }));
      loadTranslations(1, customValue, state.searchParams);
    }
  };

  const handleCustomItemsPerPageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') applyCustomItemsPerPage();
  };

  return {
    handlePageChange,
    handleItemsPerPageChange,
    handleCustomItemsPerPageChange,
    applyCustomItemsPerPage,
    handleCustomItemsPerPageKeyDown,
  } as const;
}
