import React from 'react';
import { Tooltip } from '@mui/material';
import { CopyButton } from '../common/CopyButton';
import { truncateText } from '../../utils/textUtils';
import type { CacheTranslation } from '@/types/cache';

interface TranslationTableProps {
  translations: CacheTranslation[];
  isLoading?: boolean;
  searchValue?: string;
  searchType?: string;
  checkedItems: Set<number>;
  onCheckboxChange: (id: number, checked: boolean) => void;
  onCheckAll: (checked: boolean) => void;
  onRowClick?: (id: number) => void;
  onShowTranslationDetail?: (translation: CacheTranslation) => void;
  onShowHistory?: (id: number) => void;
  onLoadTranslationHistory?: (id: number) => void;
  onDeleteCheckedItems: () => void;
  onDeleteAllItems: () => void;
}

/**
 * 번역 캐시 테이블 컴포넌트
 */
export const TranslationTable: React.FC<TranslationTableProps> = ({
  translations,
  isLoading = false,
  searchValue,
  searchType,
  checkedItems,
  onCheckboxChange,
  onCheckAll,
  onRowClick,
  onShowTranslationDetail,
  onShowHistory,
  onLoadTranslationHistory,
  onDeleteCheckedItems,
  onDeleteAllItems,
}) => {
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (translations.length === 0) {
    return (
      <div className="no-items-message">
        {searchValue || searchType === 'date'
          ? '검색 결과가 없습니다.'
          : '저장된 번역 캐시가 없습니다.'}
      </div>
    );
  }

  const isAllChecked = translations.length > 0 && translations.every((t) => checkedItems.has(t.id));

  return (
    <>
      <div className="action-buttons">
        <button className="action-button delete-checked" onClick={onDeleteCheckedItems}>
          선택 항목 삭제
        </button>
        <button className="action-button delete-all" onClick={onDeleteAllItems}>
          검색된 항목 모두 삭제
        </button>
      </div>
      <div className="table-container">
        <table className="cache-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={isAllChecked}
                  onChange={(e) => {
                    e.stopPropagation();
                    onCheckAll(e.target.checked);
                  }}
                />
              </th>
              <th>ID</th>
              <th>원문</th>
              <th>번역</th>
              <th>파일</th>
              <th>생성일</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {translations.map((translation) => (
              <tr
                key={translation.id}
                onClick={() => {
                  // 선호 순서대로 사용 가능한 클릭 핸들러 호출
                  if (onRowClick) {
                    onRowClick(translation.id);
                  } else if (onShowTranslationDetail) {
                    onShowTranslationDetail(translation);
                  }
                }}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={checkedItems.has(translation.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      onCheckboxChange(translation.id, e.target.checked);
                    }}
                  />
                </td>
                <td>{translation.id}</td>
                <td className="text-cell">
                  <div className="text-with-copy">
                    <Tooltip title={translation.source} placement="top">
                      <span id={`source-${translation.id}`}>
                        {truncateText(translation.source)}
                      </span>
                    </Tooltip>
                    <CopyButton
                      targetSelector={`#source-${translation.id}`}
                      targetValue={translation.source}
                    />
                  </div>
                </td>
                <td className="text-cell">
                  <div className="text-with-copy">
                    <Tooltip title={translation.target} placement="top">
                      <span id={`target-${translation.id}`}>
                        {truncateText(translation.target)}
                      </span>
                    </Tooltip>
                    <CopyButton
                      targetSelector={`#target-${translation.id}`}
                      targetValue={translation.target}
                    />
                  </div>
                </td>
                <td>
                  {translation.fileName ? (
                    <div className="file-info">
                      <Tooltip title={translation.fileName} placement="top">
                        <span>{truncateText(translation.fileName, 30)}</span>
                      </Tooltip>
                      {translation.filePath && (
                        <CopyButton targetValue={translation.filePath} title="경로 복사" />
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td>{new Date(translation.createdAt).toLocaleDateString()}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className="action-link history"
                    onClick={(e) => {
                      e.stopPropagation();
                      // 선호 순서대로 사용 가능한 이력 핸들러 호출
                      if (onShowHistory) {
                        onShowHistory(translation.id);
                      } else if (onLoadTranslationHistory) {
                        onLoadTranslationHistory(translation.id);
                      }
                    }}
                  >
                    이력
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TranslationTable;
