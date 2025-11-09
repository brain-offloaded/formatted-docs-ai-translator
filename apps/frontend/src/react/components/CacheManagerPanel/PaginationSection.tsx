import React from 'react';
import { PaginationControls } from '../common/PaginationControls';

interface PaginationSectionProps {
  currentPage: number;
  itemsPerPage: number;
  itemsPerPageOptions: number[];
  customItemsPerPage: string;
  isCustomPerPageMode: boolean;
  totalItems: number;
  onPageChange: (newPage: number) => void;
  onItemsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onCustomItemsPerPageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCustomItemsPerPageKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  applyCustomItemsPerPage: () => void;
}

export const PaginationSection: React.FC<PaginationSectionProps> = ({
  currentPage,
  itemsPerPage,
  itemsPerPageOptions,
  customItemsPerPage,
  isCustomPerPageMode,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  onCustomItemsPerPageChange,
  onCustomItemsPerPageKeyDown,
  applyCustomItemsPerPage,
}) => {
  const handleItemsPerPageChange = React.useCallback(
    (value: string) => {
      const syntheticEvent = {
        target: { value },
      } as React.ChangeEvent<HTMLSelectElement>;
      onItemsPerPageChange(syntheticEvent);
    },
    [onItemsPerPageChange]
  );

  const handleCustomItemsPerPageChange = React.useCallback(
    (value: string) => {
      const syntheticEvent = {
        target: { value },
      } as React.ChangeEvent<HTMLInputElement>;
      onCustomItemsPerPageChange(syntheticEvent);
    },
    [onCustomItemsPerPageChange]
  );

  return (
    <PaginationControls
      currentPage={currentPage}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      itemsPerPageOptions={itemsPerPageOptions}
      isCustomPerPageMode={isCustomPerPageMode}
      customItemsPerPage={customItemsPerPage}
      onPageChange={onPageChange}
      onItemsPerPageChange={handleItemsPerPageChange}
      onCustomItemsPerPageChange={handleCustomItemsPerPageChange}
      onCustomItemsPerPageKeyDown={onCustomItemsPerPageKeyDown}
      onApplyCustomItemsPerPage={applyCustomItemsPerPage}
      goToPageLabel="페이지 이동"
    />
  );
};

export default PaginationSection;
