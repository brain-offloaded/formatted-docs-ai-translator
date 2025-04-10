import React from 'react';
import { Tooltip } from '@mui/material';
import { CopyButton } from './CopyButton';
import { truncateText } from '../../utils/textUtils';

interface DataTableColumn<T> {
  key: string;
  header: string;
  width?: string | number;
  render?: (item: T, index: number) => React.ReactNode;
  getCellValue?: (item: T) => string | null;
}

interface DataTableProps<T> {
  items: T[];
  columns: DataTableColumn<T>[];
  idExtractor: (item: T) => number;
  checkedItems: Set<number>;
  onCheckboxChange: (id: number, checked: boolean) => void;
  onCheckAll: (checked: boolean) => void;
  onRowClick?: (id: number) => void;
  onDeleteCheckedItems?: () => void;
  onDeleteAllItems?: () => void;
  isLoading?: boolean;
  emptyMessage?: string;
  actionButtons?: React.ReactNode;
  className?: string;
}

/**
 * 공통으로 사용할 수 있는 데이터 테이블 컴포넌트
 * 체크박스, 행 클릭, 삭제 버튼 등의 기능을 공통화
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DataTable = <T extends Record<string, any>>(props: DataTableProps<T>) => {
  const {
    items,
    columns,
    idExtractor,
    checkedItems,
    onCheckboxChange,
    onCheckAll,
    onRowClick,
    onDeleteCheckedItems,
    onDeleteAllItems,
    isLoading = false,
    emptyMessage = '표시할 데이터가 없습니다.',
    actionButtons,
    className = '',
  } = props;

  // 모든 항목이 체크되었는지 확인
  const isAllChecked =
    items.length > 0 && items.every((item) => checkedItems.has(idExtractor(item)));

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className={`data-table-container ${className}`}>
      {(onDeleteCheckedItems || onDeleteAllItems || actionButtons) && (
        <div className="action-buttons">
          {onDeleteCheckedItems && (
            <button className="action-button delete-button" onClick={onDeleteCheckedItems}>
              선택 항목 삭제
            </button>
          )}
          {onDeleteAllItems && (
            <button className="action-button delete-all-button" onClick={onDeleteAllItems}>
              검색된 항목 모두 삭제
            </button>
          )}
          {actionButtons}
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={isAllChecked}
                  onChange={(e) => onCheckAll(e.target.checked)}
                />
              </th>
              {columns.map((column) => (
                <th key={column.key} style={{ width: column.width }}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={idExtractor(item)}
                onClick={() => onRowClick && onRowClick(idExtractor(item))}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                <td className="checkbox-cell" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={checkedItems.has(idExtractor(item))}
                    onChange={(e) => onCheckboxChange(idExtractor(item), e.target.checked)}
                  />
                </td>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render ? (
                      column.render(item, index)
                    ) : column.getCellValue ? (
                      <div className="text-with-copy">
                        <Tooltip title={column.getCellValue(item) || ''} placement="top">
                          <span id={`${column.key}-${idExtractor(item)}`}>
                            {truncateText(column.getCellValue(item))}
                          </span>
                        </Tooltip>
                        <CopyButton
                          targetSelector={`#${column.key}-${idExtractor(item)}`}
                          targetValue={column.getCellValue(item) || ''}
                        />
                      </div>
                    ) : (
                      item[column.key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
