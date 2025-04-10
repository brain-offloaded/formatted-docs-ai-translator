import React from 'react';

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

/**
 * 페이지네이션 섹션 컴포넌트
 */
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
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="pagination-container">
      <div className="items-per-page-selector">
        <span>페이지당 항목 수:</span>
        <select
          value={isCustomPerPageMode ? 'custom' : itemsPerPage.toString()}
          onChange={onItemsPerPageChange}
        >
          {itemsPerPageOptions.map((option) => (
            <option key={option} value={option.toString()}>
              {option}
            </option>
          ))}
          <option value="custom">직접 입력</option>
        </select>

        {isCustomPerPageMode && (
          <div className="custom-items-per-page">
            <input
              type="number"
              min="1"
              value={customItemsPerPage}
              onChange={onCustomItemsPerPageChange}
              onKeyDown={onCustomItemsPerPageKeyDown}
              placeholder="항목 수 입력"
            />
            <button onClick={applyCustomItemsPerPage}>적용</button>
          </div>
        )}
      </div>

      <div className="pagination">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          이전
        </button>
        <span>
          {currentPage} / {totalPages || 1}
        </span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
          다음
        </button>
      </div>
    </div>
  );
};

export default PaginationSection;
