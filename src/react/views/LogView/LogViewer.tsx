import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/LogViewer.css';
import '../../styles/DataTable.css';
import { useConfirmModal } from '../../components/common/ConfirmModal';
import { CopyButton } from '../../components/common/CopyButton';
import { useCheckboxes } from '../../hooks/useCheckboxes';
import { usePagination } from '../../hooks/usePagination';
import { useModal } from '../../contexts/ModalContext';
import { DataTable } from '../../components/common/DataTable';
import {
  formatRelativeDate,
  getDefaultEndDateTomorrow,
  getDefaultStartDate,
} from '../../utils/dateUtils';
import { openAlertModal } from '../../utils/modalUtils';
import { FormField } from '../../components/common/FormField';
import { IpcChannel } from '@/nest/common/ipc.channel';

interface Log {
  id: number;
  level: string;
  message: string;
  context: string | null;
  metadata: string | null;
  timestamp: string;
  module?: string;
  stack?: string;
  meta?: Record<string, unknown>;
}

interface LogViewerState {
  logs: Log[];
  totalItems: number;
  searchParams: {
    levels: string[];
    startDate: string;
    endDate: string;
  };
  isLoading: boolean;
  selectedLog: Log | null;
  isJsonView: boolean;
}

const LogViewer: React.FC = () => {
  const [state, setState] = useState<LogViewerState>({
    logs: [],
    totalItems: 0,
    searchParams: {
      levels: ['error', 'warn', 'info', 'debug'],
      startDate: getDefaultStartDate(),
      endDate: getDefaultEndDateTomorrow(),
    },
    isLoading: false,
    selectedLog: null,
    isJsonView: true,
  });

  // 새로운 모달 시스템 사용
  const { openModal, closeModal } = useModal();
  const [currentModalId, setCurrentModalId] = useState<string | null>(null);

  const { checkedItems, handleCheckboxChange, handleCheckAll, clearCheckedItems } =
    useCheckboxes<Log>({
      idExtractor: (log) => log.id,
    });
  const pagination = usePagination({
    initialItemsPerPage: 20,
    itemsPerPageOptions: [10, 20, 50, 100],
  });

  const { openConfirmModal } = useConfirmModal();

  // 상세 모달 열기
  const openLogDetailModal = useCallback(
    (log: Log) => {
      setState((prev) => ({
        ...prev,
        selectedLog: log,
      }));

      // 새로운 모달 시스템으로 모달 열기
      const modalId = openModal({
        title: '로그 상세 정보',
        content: renderLogDetailContent(log),
        size: 'large',
        className: 'log-detail-modal',
        onClose: () => {
          setState((prev) => ({ ...prev, selectedLog: null }));
        },
      });

      setCurrentModalId(modalId);
    },
    [openModal]
  );

  // 모달 닫기 핸들러
  const handleModalClose = useCallback(() => {
    if (currentModalId) {
      closeModal(currentModalId);
      setCurrentModalId(null);
    }

    setState((prev) => ({
      ...prev,
      selectedLog: null,
    }));
  }, [closeModal, currentModalId]);

  // 로그 데이터 로드 함수
  const loadLogs = useCallback(
    async (
      page = pagination.currentPage,
      itemsPerPage = pagination.itemsPerPage,
      searchParams = state.searchParams
    ) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetLogs, {
          page,
          itemsPerPage,
          searchParams,
        });

        setState((prev) => ({
          ...prev,
          logs: result.logs,
          totalItems: result.totalItems,
          isLoading: false,
        }));
      } catch (error) {
        console.error('로그 로딩 실패:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [pagination.currentPage, pagination.itemsPerPage, state.searchParams]
  );

  // 컴포넌트 마운트 시 로그 데이터 로드
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // 로그 레벨 체크박스 변경 핸들러
  const handleLogLevelChange = (level: string, checked: boolean) => {
    const levels = [...state.searchParams.levels];

    if (checked && !levels.includes(level)) {
      levels.push(level);
    } else if (!checked && levels.includes(level)) {
      const index = levels.indexOf(level);
      if (index !== -1) {
        levels.splice(index, 1);
      }
    }

    setState((prev) => ({
      ...prev,
      searchParams: {
        ...prev.searchParams,
        levels,
      },
    }));
  };

  // 검색 파라미터 변경 핸들러
  const handleSearchParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setState((prev) => ({
      ...prev,
      searchParams: {
        ...prev.searchParams,
        [name]: value,
      },
    }));
  };

  // 페이지네이션 및 검색 핸들러
  const handlePageChange = useCallback(
    (newPage: number) => {
      // 페이지 변경 시 체크박스 상태 초기화
      clearCheckedItems();

      // 기존 페이지 변경 함수 호출
      pagination.handlePageChange(newPage);

      // 새 페이지 데이터 로드
      loadLogs(newPage, pagination.itemsPerPage, state.searchParams);
    },
    [clearCheckedItems, pagination, loadLogs, state.searchParams]
  );

  // 페이지당 항목 수 변경 시 처리
  const handleItemsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      // 항목 수 변경 시 체크박스 상태 초기화
      clearCheckedItems();

      // 기존 항목 수 변경 함수 호출
      pagination.handleItemsPerPageChange(e);

      const value = e.target.value;
      if (value !== 'custom') {
        const newItemsPerPage = parseInt(value, 10);
        loadLogs(1, newItemsPerPage, state.searchParams);
      }
    },
    [clearCheckedItems, pagination, loadLogs, state.searchParams]
  );

  // 검색 실행 핸들러
  const handleSearch = useCallback(() => {
    // 검색 시 체크박스 상태 초기화
    clearCheckedItems();

    setState((prev) => ({
      ...prev,
      isLoading: true,
    }));

    loadLogs(1, pagination.itemsPerPage, state.searchParams);
  }, [clearCheckedItems, pagination.itemsPerPage, loadLogs, state.searchParams]);

  // 로그 상세 내용 렌더링 (모달 콘텐츠 함수)
  const renderLogDetailContent = (log: Log) => {
    return (
      <div className="log-detail">
        <div className="log-info">
          <div className="log-info-item">
            <span className="log-info-label">ID:</span>
            <span>{log.id}</span>
          </div>
          <div className="log-info-item">
            <span className="log-info-label">레벨:</span>
            <span className={`log-level ${log.level.toLowerCase()}`}>{log.level}</span>
          </div>
          <div className="log-info-item">
            <span className="log-info-label">모듈:</span>
            <span>{log.module || log.context}</span>
          </div>
          <div className="log-info-item">
            <span className="log-info-label">날짜:</span>
            <span>{new Date(log.timestamp).toLocaleString()}</span>
          </div>
        </div>

        <div className="log-message">
          <div className="log-message-header">
            <h4>메시지</h4>
            <CopyButton targetValue={log.message} />
          </div>
          <pre>{log.message}</pre>
        </div>

        {log.stack && (
          <div className="log-message">
            <div className="log-message-header">
              <h4>스택 트레이스</h4>
              <CopyButton targetValue={log.stack} />
            </div>
            <pre>{log.stack}</pre>
          </div>
        )}

        {(log.meta || log.metadata) && (
          <div className="log-message">
            <div className="log-message-header">
              <h4>메타데이터</h4>
              <CopyButton targetValue={JSON.stringify(log.meta, null, 2) || log.metadata!} />
            </div>
            <pre>{JSON.stringify(log.meta, null, 2) || log.metadata!}</pre>
          </div>
        )}
      </div>
    );
  };

  // 로그 테이블 렌더링
  const renderLogTable = () => {
    const logTableColumns = [
      {
        key: 'timestamp',
        header: '시간',
        width: '100px',
        render: (log: Log) => formatRelativeDate(log.timestamp),
      },
      {
        key: 'level',
        header: '레벨',
        width: '100px',
        render: (log: Log) => <span className={`log-level ${log.level}`}>{log.level}</span>,
      },
      {
        key: 'message',
        header: '메시지',
        width: '40%',
        getCellValue: (log: Log) => log.message,
      },
      {
        key: 'metadata',
        header: '메타데이터',
        width: '30%',
        getCellValue: (log: Log) => log.metadata,
      },
      {
        key: 'actions',
        header: '작업',
        width: '90px',
        render: (log: Log) => (
          <button
            className="view-detail-button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              openLogDetailModal(log);
            }}
          >
            상세보기
          </button>
        ),
      },
    ];

    return (
      <DataTable
        items={state.logs}
        columns={logTableColumns}
        idExtractor={(log) => log.id}
        checkedItems={checkedItems}
        onCheckboxChange={handleCheckboxChange}
        onCheckAll={(checked) => handleCheckAll(state.logs, checked)}
        onRowClick={(id) => {
          const log = state.logs.find((log) => log.id === id);
          if (log) openLogDetailModal(log);
        }}
        onDeleteCheckedItems={handleDeleteCheckedLogs}
        onDeleteAllItems={handleDeleteAllLogs}
        isLoading={state.isLoading}
        emptyMessage="로그가 없습니다."
        className="log-table-container"
      />
    );
  };

  // 페이지네이션 렌더링
  const renderPagination = () => {
    const totalPages = pagination.getTotalPages(state.totalItems);

    return (
      <div className="pagination-container">
        <div className="items-per-page-selector">
          <span>페이지당 항목 수:</span>
          <select
            value={pagination.isCustomPerPageMode ? 'custom' : pagination.itemsPerPage.toString()}
            onChange={handleItemsPerPageChange}
          >
            {pagination.itemsPerPageOptions.map((option) => (
              <option key={option} value={option.toString()}>
                {option}
              </option>
            ))}
            <option value="custom">직접 입력</option>
          </select>

          {pagination.isCustomPerPageMode && (
            <div className="custom-items-per-page">
              <input
                type="number"
                min="1"
                value={pagination.customItemsPerPage}
                onChange={pagination.handleCustomItemsPerPageChange}
                onKeyDown={pagination.handleCustomItemsPerPageKeyDown}
                placeholder="항목 수 입력"
              />
              <button
                onClick={() => {
                  clearCheckedItems();
                  pagination.applyCustomItemsPerPage();
                  loadLogs(1, parseInt(pagination.customItemsPerPage), state.searchParams);
                }}
              >
                적용
              </button>
            </div>
          )}
        </div>

        <div className="pagination">
          <button
            id="prev-page"
            disabled={pagination.currentPage === 1}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            이전
          </button>
          <span>
            {pagination.currentPage} / {totalPages}
          </span>
          <button
            id="next-page"
            disabled={pagination.currentPage === totalPages}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            다음
          </button>
        </div>
      </div>
    );
  };

  // 검색 섹션 렌더링
  const renderSearchSection = () => {
    return (
      <div className="search-section">
        <div className="log-level-filters">
          <h3>로그 레벨 필터</h3>
          <div className="level-filter-buttons">
            <button
              className={`level-filter-button error ${state.searchParams.levels.includes('error') ? 'active' : ''}`}
              onClick={() =>
                handleLogLevelChange('error', !state.searchParams.levels.includes('error'))
              }
            >
              <span className="level-indicator"></span>
              <span className="level-label">오류 (Error)</span>
            </button>
            <button
              className={`level-filter-button warn ${state.searchParams.levels.includes('warn') ? 'active' : ''}`}
              onClick={() =>
                handleLogLevelChange('warn', !state.searchParams.levels.includes('warn'))
              }
            >
              <span className="level-indicator"></span>
              <span className="level-label">경고 (Warning)</span>
            </button>
            <button
              className={`level-filter-button info ${state.searchParams.levels.includes('info') ? 'active' : ''}`}
              onClick={() =>
                handleLogLevelChange('info', !state.searchParams.levels.includes('info'))
              }
            >
              <span className="level-indicator"></span>
              <span className="level-label">정보 (Info)</span>
            </button>
            <button
              className={`level-filter-button debug ${state.searchParams.levels.includes('debug') ? 'active' : ''}`}
              onClick={() =>
                handleLogLevelChange('debug', !state.searchParams.levels.includes('debug'))
              }
            >
              <span className="level-indicator"></span>
              <span className="level-label">디버그 (Debug)</span>
            </button>
          </div>
        </div>

        <div className="date-filters">
          <FormField label="시작 날짜" id="startDate">
            <input
              type="date"
              name="startDate"
              value={state.searchParams.startDate}
              onChange={handleSearchParamChange}
            />
          </FormField>

          <FormField label="종료 날짜" id="endDate">
            <input
              type="date"
              name="endDate"
              value={state.searchParams.endDate}
              onChange={handleSearchParamChange}
            />
          </FormField>
        </div>

        <div className="search-button-container">
          <button onClick={handleSearch} className="action-button">
            검색
          </button>
        </div>
      </div>
    );
  };

  // 로그 삭제 함수
  const handleDeleteCheckedLogs = useCallback(() => {
    if (checkedItems.size === 0) {
      openAlertModal({ message: '삭제할 로그를 선택해주세요.' }, openModal, closeModal);
      return;
    }

    // 새로운 모달 시스템 사용
    openConfirmModal({
      message: '선택한 항목을 삭제하시겠습니까?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await window.electron.ipcRenderer.invoke(IpcChannel.DeleteLogs, {
            logIds: Array.from(checkedItems),
          });

          // 모달 닫기 및 상태 초기화
          handleModalClose();
          setState((prev) => ({
            ...prev,
            isLoading: true,
          }));

          // 현재 상태로 데이터 다시 로드
          loadLogs(pagination.currentPage, pagination.itemsPerPage, state.searchParams);
        } catch (error) {
          console.error('로그 삭제 실패:', error);
        }
      },
    });
  }, [
    checkedItems,
    closeModal,
    loadLogs,
    openModal,
    pagination.currentPage,
    pagination.itemsPerPage,
    state.searchParams,
    handleModalClose,
    openConfirmModal,
  ]);

  // 모든 로그 삭제 함수
  const handleDeleteAllLogs = useCallback(() => {
    if (state.logs.length === 0) {
      openAlertModal({ message: '삭제할 로그가 없습니다.' }, openModal, closeModal);
      return;
    }

    // 새로운 모달 시스템 사용
    openConfirmModal({
      message: '검색된 모든 로그를 삭제하시겠습니까?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await window.electron.ipcRenderer.invoke(IpcChannel.DeleteAllLogs, {
            searchParams: state.searchParams,
          });

          // 모달 닫기 및 상태 초기화
          handleModalClose();
          setState((prev) => ({
            ...prev,
            isLoading: true,
          }));

          // 현재 상태로 데이터 다시 로드
          loadLogs(pagination.currentPage, pagination.itemsPerPage, state.searchParams);
        } catch (error) {
          console.error('로그 삭제 실패:', error);
        }
      },
    });
  }, [
    closeModal,
    loadLogs,
    openModal,
    pagination.currentPage,
    pagination.itemsPerPage,
    state.logs.length,
    state.searchParams,
    handleModalClose,
    openConfirmModal,
  ]);

  // 로딩 템플릿
  const renderLoading = () => {
    if (!state.isLoading) return null;
    return <div className="loading">로그를 불러오는 중...</div>;
  };

  return (
    <div className="log-viewer">
      <h2>로그 보기</h2>

      {renderSearchSection()}
      {renderLoading()}
      {!state.isLoading && state.logs.length === 0 ? (
        <div className="no-logs-message">로그가 없습니다.</div>
      ) : (
        <>
          {!state.isLoading && renderLogTable()}
          {state.logs.length > 0 && renderPagination()}
        </>
      )}
    </div>
  );
};

export default LogViewer;
