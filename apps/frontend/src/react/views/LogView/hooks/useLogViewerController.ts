import { useCallback, useEffect, useRef, useState } from 'react';
import { useModal, createModalId } from '@/react/contexts/ModalContext';
import { useCheckboxes } from '@/react/hooks/useCheckboxes';
import { usePagination } from '@/react/hooks/usePagination';
import { useConfirmModal } from '@/react/components/common/ConfirmModal';
import { openAlertModal } from '@/react/utils/modalUtils';
import { LogsService } from '@/react/api/generated/services/LogsService';
import { DeleteLogsRequestDto } from '@/react/api/generated/models/DeleteLogsRequestDto';
import type { LogDetail, LogListItem } from '../types';
import { getDefaultEndDateTomorrow, getDefaultStartDate } from '@/react/utils/dateUtils';

interface LogViewerState {
  logs: LogListItem[];
  totalItems: number;
  searchParams: {
    levels: string[];
    startDate: string;
    endDate: string;
  };
  isLoading: boolean;
  selectedLog: LogDetail | null;
  isJsonView: boolean;
  reloadKey: number;
}

interface UseLogViewerControllerResult {
  state: LogViewerState;
  pagination: ReturnType<typeof usePagination>;
  checkedItems: Set<number>;
  handleCheckboxChange: (id: number, checked: boolean) => void;
  handleCheckAll: (items: LogListItem[], checked: boolean) => void;
  clearCheckedItems: () => void;
  openLogDetailModal: (log: LogListItem) => void;
  handleModalClose: () => void;
  loadLogs: (
    page?: number,
    itemsPerPage?: number,
    searchParams?: LogViewerState['searchParams']
  ) => Promise<void>;
  handleLogLevelChange: (level: string, checked: boolean) => void;
  handleSearchParamChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearch: () => void;
  handleDeleteCheckedLogs: () => void;
  handleDeleteAllLogs: () => void;
}

const sanitizeSearchParams = (
  searchParams: LogViewerState['searchParams']
): DeleteLogsRequestDto['searchParams'] => {
  const sanitized: DeleteLogsRequestDto['searchParams'] = {};

  if (Array.isArray(searchParams.levels) && searchParams.levels.length > 0) {
    sanitized.levels = searchParams.levels;
  }

  const trimmedStart = searchParams.startDate?.trim();
  if (trimmedStart) {
    sanitized.startDate = trimmedStart;
  }

  const trimmedEnd = searchParams.endDate?.trim();
  if (trimmedEnd) {
    sanitized.endDate = trimmedEnd;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
};

export const useLogViewerController = (): UseLogViewerControllerResult => {
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
    reloadKey: 0,
  });

  const { openModal, closeModal, updateModal } = useModal();
  const [currentModalId, setCurrentModalId] = useState<string | null>(null);
  const currentModalIdRef = useRef<string | null>(null);

  const { openConfirmModal } = useConfirmModal();

  const { checkedItems, handleCheckboxChange, handleCheckAll, clearCheckedItems } =
    useCheckboxes<LogListItem>({
      idExtractor: (log) => log.id,
    });

  const pagination = usePagination({
    initialItemsPerPage: 20,
    itemsPerPageOptions: [10, 20, 50, 100],
  });
  const { handlePageChange } = pagination;

  const loadLogs = useCallback(
    async (
      page = pagination.currentPage,
      itemsPerPage = pagination.itemsPerPage,
      searchParams = state.searchParams
    ) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const filters = sanitizeSearchParams(searchParams);
        const response = await LogsService.loggerControllerGetLogs({
          page,
          itemsPerPage,
          levels: filters?.levels,
          startDate: filters?.startDate,
          endDate: filters?.endDate,
        });

        if (!response.success) {
          throw new Error(response.message ?? '로그 목록을 불러오지 못했습니다.');
        }

        setState((prev) => ({
          ...prev,
          logs: response.logs.map((log) => ({
            id: log.id,
            level: log.level,
            message: log.message,
            context: log.context ?? null,
            metadataPreview: log.metadataPreview ?? null,
            hasMetadata: log.hasMetadata,
            timestamp: log.timestamp,
          })),
          totalItems: response.totalItems,
          isLoading: false,
        }));
      } catch (error) {
        console.error('로그 로딩 실패:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [pagination.currentPage, pagination.itemsPerPage, state.searchParams]
  );

  useEffect(() => {
    void loadLogs();
  }, [loadLogs, state.reloadKey]);

  const openLogDetailModal = useCallback(
    (log: LogListItem) => {
      const previewDetail: LogDetail = {
        ...log,
        metadata: log.metadataPreview,
        stack: null,
        meta: null,
      };

      setState((prev) => ({
        ...prev,
        selectedLog: previewDetail,
      }));

      const modalId = createModalId('log.detail', String(log.id));

      if (currentModalIdRef.current && currentModalIdRef.current !== modalId) {
        closeModal(currentModalIdRef.current);
      }

      const fetchDetail = async () => {
        try {
          const response = await LogsService.loggerControllerGetLogDetail({ id: log.id });

          if (currentModalIdRef.current !== modalId) {
            return;
          }

          if (!response.success || !response.log) {
            throw new Error(response.message ?? '로그 상세 조회에 실패했습니다.');
          }

          const detail: LogDetail = {
            id: response.log.id,
            level: response.log.level,
            message: response.log.message,
            context: response.log.context ?? null,
            metadataPreview: response.log.metadataPreview ?? null,
            hasMetadata: response.log.hasMetadata,
            timestamp: response.log.timestamp,
            metadata: response.log.metadata ?? null,
            stack: response.log.stack ?? null,
            meta: response.log.meta ?? null,
          };

          setState((prev) => ({
            ...prev,
            selectedLog: detail,
          }));

          updateModal(modalId, (prevPayload) => ({
            ...prevPayload,
            log: detail,
            isLoading: false,
            error: undefined,
          }));
        } catch (error) {
          console.error('로그 상세 조회 실패:', error);

          if (currentModalIdRef.current !== modalId) {
            return;
          }

          updateModal(modalId, (prevPayload) => ({
            ...prevPayload,
            isLoading: false,
            error: '로그 상세 정보를 불러오지 못했습니다.',
          }));
        }
      };

      const handleRetry = () => {
        updateModal(modalId, (prevPayload) => ({
          ...prevPayload,
          isLoading: true,
          error: undefined,
        }));
        void fetchDetail();
      };

      const openedId = openModal({
        id: modalId,
        type: 'log.detail',
        payload: {
          log: previewDetail,
          isLoading: true,
          error: undefined,
          onRetry: handleRetry,
        },
        frameOptions: {
          onClose: () => {
            setCurrentModalId(null);
            currentModalIdRef.current = null;
            setState((prevState) => ({ ...prevState, selectedLog: null }));
          },
        },
      });

      setCurrentModalId(openedId);
      currentModalIdRef.current = openedId;

      void fetchDetail();
    },
    [closeModal, updateModal, openModal]
  );

  const handleModalClose = useCallback(() => {
    if (currentModalId) {
      closeModal(currentModalId);
    } else {
      setState((prev) => ({
        ...prev,
        selectedLog: null,
      }));
      setCurrentModalId(null);
      currentModalIdRef.current = null;
    }
  }, [closeModal, currentModalId]);

  const handleLogLevelChange = useCallback((level: string, checked: boolean) => {
    setState((prev) => {
      const levels = [...prev.searchParams.levels];

      if (checked && !levels.includes(level)) {
        levels.push(level);
      } else if (!checked && levels.includes(level)) {
        const index = levels.indexOf(level);
        if (index !== -1) {
          levels.splice(index, 1);
        }
      }

      return {
        ...prev,
        searchParams: {
          ...prev.searchParams,
          levels,
        },
      };
    });
  }, []);

  const handleSearchParamChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setState((prev) => ({
      ...prev,
      searchParams: {
        ...prev.searchParams,
        [name]: value,
      },
    }));
  }, []);

  const handleSearch = useCallback(() => {
    clearCheckedItems();

    handlePageChange(1);
    setState((prev) => ({
      ...prev,
      reloadKey: prev.reloadKey + 1,
    }));
  }, [clearCheckedItems, handlePageChange]);

  const refreshAfterDeletion = useCallback(() => {
    handleModalClose();
    setState((prev) => ({
      ...prev,
      isLoading: true,
    }));

    void loadLogs(pagination.currentPage, pagination.itemsPerPage, state.searchParams);
  }, [
    handleModalClose,
    loadLogs,
    pagination.currentPage,
    pagination.itemsPerPage,
    state.searchParams,
  ]);

  const handleDeleteCheckedLogs = useCallback(() => {
    if (checkedItems.size === 0) {
      openAlertModal({ message: '삭제할 로그를 선택해주세요.' }, openModal);
      return;
    }

    openConfirmModal({
      message: '선택한 항목을 삭제하시겠습니까?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const requestBody: DeleteLogsRequestDto = {
            logIds: Array.from(checkedItems),
          };

          const response = await LogsService.loggerControllerDeleteLogs({ requestBody });
          if (!response.success) {
            throw new Error(response.message ?? '로그 삭제에 실패했습니다.');
          }
          refreshAfterDeletion();
        } catch (error) {
          console.error('로그 삭제 실패:', error);
        }
      },
    });
  }, [checkedItems, openModal, openConfirmModal, refreshAfterDeletion]);

  const handleDeleteAllLogs = useCallback(() => {
    if (state.logs.length === 0) {
      openAlertModal({ message: '삭제할 로그가 없습니다.' }, openModal);
      return;
    }

    openConfirmModal({
      message: '검색된 모든 로그를 삭제하시겠습니까?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const searchFilters = sanitizeSearchParams(state.searchParams) ?? {};
          const requestBody: DeleteLogsRequestDto = {
            searchParams: searchFilters,
          };

          const response = await LogsService.loggerControllerDeleteLogs({ requestBody });
          if (!response.success) {
            throw new Error(response.message ?? '로그 삭제에 실패했습니다.');
          }
          refreshAfterDeletion();
        } catch (error) {
          console.error('로그 삭제 실패:', error);
        }
      },
    });
  }, [openModal, openConfirmModal, refreshAfterDeletion, state.logs.length, state.searchParams]);

  return {
    state,
    pagination,
    checkedItems,
    handleCheckboxChange,
    handleCheckAll,
    clearCheckedItems,
    openLogDetailModal,
    handleModalClose,
    loadLogs,
    handleLogLevelChange,
    handleSearchParamChange,
    handleSearch,
    handleDeleteCheckedLogs,
    handleDeleteAllLogs,
  };
};
