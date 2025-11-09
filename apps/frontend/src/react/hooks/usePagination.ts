import { useState, useCallback } from 'react';

interface PaginationOptions {
  initialPage?: number;
  initialItemsPerPage?: number;
  itemsPerPageOptions?: number[];
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  itemsPerPageOptions: number[];
  customItemsPerPage: string;
  isCustomPerPageMode: boolean;
}

/**
 * 페이지네이션 관리를 위한 커스텀 훅
 */
export const usePagination = ({
  initialPage = 1,
  initialItemsPerPage = 20,
  itemsPerPageOptions = [10, 20, 50, 100],
}: PaginationOptions = {}) => {
  const [paginationState, setPaginationState] = useState<PaginationState>({
    currentPage: initialPage,
    itemsPerPage: initialItemsPerPage,
    itemsPerPageOptions,
    customItemsPerPage: '',
    isCustomPerPageMode: false,
  });

  /**
   * 페이지 변경 처리
   */
  const handlePageChange = useCallback((newPage: number) => {
    setPaginationState((prev) => ({
      ...prev,
      currentPage: newPage,
    }));
  }, []);

  /**
   * 페이지당 항목 수 변경 처리
   */
  const handleItemsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value === 'custom') {
      // 사용자 정의 값 선택 시 현재 itemsPerPage 값을 customItemsPerPage에 설정
      setPaginationState((prev) => ({
        ...prev,
        customItemsPerPage: prev.itemsPerPage.toString(),
        isCustomPerPageMode: true,
      }));
    } else {
      const newItemsPerPage = parseInt(value, 10);
      setPaginationState((prev) => ({
        ...prev,
        itemsPerPage: newItemsPerPage,
        currentPage: 1,
        customItemsPerPage: '',
        isCustomPerPageMode: false,
      }));
    }
  }, []);

  /**
   * 사용자 정의 페이지당 항목 수 변경 처리
   */
  const handleCustomItemsPerPageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPaginationState((prev) => ({
      ...prev,
      customItemsPerPage: e.target.value,
    }));
  }, []);

  /**
   * 사용자 정의 페이지당 항목 수 적용
   */
  const applyCustomItemsPerPage = useCallback(() => {
    const customValue = parseInt(paginationState.customItemsPerPage, 10);
    if (!isNaN(customValue) && customValue > 0) {
      setPaginationState((prev) => ({
        ...prev,
        itemsPerPage: customValue,
        currentPage: 1,
      }));
    }
  }, [paginationState.customItemsPerPage]);

  /**
   * 사용자 정의 페이지당 항목 수 입력 필드에서 엔터 키 처리
   */
  const handleCustomItemsPerPageKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        applyCustomItemsPerPage();
      }
    },
    [applyCustomItemsPerPage]
  );

  return {
    ...paginationState,
    handlePageChange,
    handleItemsPerPageChange,
    handleCustomItemsPerPageChange,
    applyCustomItemsPerPage,
    handleCustomItemsPerPageKeyDown,
    // 총 페이지 수 계산 편의 함수 추가
    getTotalPages: (totalItems: number) =>
      Math.ceil(totalItems / paginationState.itemsPerPage) || 1,
  };
};
