import React from 'react';
import { PaginationControls } from '@/react/components/common/PaginationControls';

interface PaginationApi {
  currentPage: number;
  itemsPerPage: number;
  itemsPerPageOptions: number[];
  customItemsPerPage: string;
  isCustomPerPageMode: boolean;
  getTotalPages: (totalItems: number) => number;
  handlePageChange: (newPage: number) => void;
  handleItemsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleCustomItemsPerPageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCustomItemsPerPageKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  applyCustomItemsPerPage: () => void;
}

interface Props {
  pagination: PaginationApi;
  totalItems: number;
  clearCheckedItems: () => void;
}

export const LogPagination: React.FC<Props> = ({ pagination, totalItems, clearCheckedItems }) => {
  const {
    currentPage,
    itemsPerPage,
    itemsPerPageOptions,
    customItemsPerPage,
    isCustomPerPageMode,
    handlePageChange,
    handleItemsPerPageChange,
    handleCustomItemsPerPageChange,
    handleCustomItemsPerPageKeyDown,
    applyCustomItemsPerPage,
  } = pagination;

  const handleChangePage = React.useCallback(
    (page: number) => {
      clearCheckedItems();
      handlePageChange(page);
    },
    [clearCheckedItems, handlePageChange]
  );

  const handleChangeItemsPerPage = React.useCallback(
    (value: string) => {
      clearCheckedItems();
      const syntheticEvent = {
        target: { value },
      } as React.ChangeEvent<HTMLSelectElement>;
      handleItemsPerPageChange(syntheticEvent);
      if (value !== 'custom') {
        handlePageChange(1);
      }
    },
    [clearCheckedItems, handleItemsPerPageChange, handlePageChange]
  );

  const handleCustomPerPageChange = React.useCallback(
    (value: string) => {
      const syntheticEvent = {
        target: { value },
      } as React.ChangeEvent<HTMLInputElement>;
      handleCustomItemsPerPageChange(syntheticEvent);
    },
    [handleCustomItemsPerPageChange]
  );

  const handleApplyCustom = React.useCallback(() => {
    clearCheckedItems();
    applyCustomItemsPerPage();
    handlePageChange(1);
  }, [applyCustomItemsPerPage, clearCheckedItems, handlePageChange]);

  return (
    <PaginationControls
      currentPage={currentPage}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      itemsPerPageOptions={itemsPerPageOptions}
      isCustomPerPageMode={isCustomPerPageMode}
      customItemsPerPage={customItemsPerPage}
      onPageChange={handleChangePage}
      onItemsPerPageChange={handleChangeItemsPerPage}
      onCustomItemsPerPageChange={handleCustomPerPageChange}
      onCustomItemsPerPageKeyDown={handleCustomItemsPerPageKeyDown}
      onApplyCustomItemsPerPage={handleApplyCustom}
    />
  );
};

export default LogPagination;
