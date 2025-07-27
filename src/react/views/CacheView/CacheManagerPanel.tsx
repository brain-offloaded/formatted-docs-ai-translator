import React, { useState, useEffect, useCallback } from 'react';

import { TranslationHistory } from '@/types/cache';

import { PaginationSection } from '../../components/CacheManagerPanel/PaginationSection';
import { SearchSection } from '../../components/CacheManagerPanel/SearchSection';
import { TranslationDetailModal } from '../../components/CacheManagerPanel/TranslationDetailModal'; // Import Detail Modal
import { TranslationHistoryModal } from '../../components/CacheManagerPanel/TranslationHistoryModal'; // Import History Modal
import { useConfirmModal } from '../../components/common/ConfirmModal';
import { useModal } from '../../contexts/ModalContext';
import { useCheckboxes } from '../../hooks/useCheckboxes';
import { DataTable } from '../../components/common/DataTable'; // 데이터 테이블 컴포넌트 추가
import { getDefaultStartDate, getDefaultEndDate } from '../../utils/dateUtils';
import { truncateText } from '../../utils/textUtils';
import { openAlertModal } from '../../utils/modalUtils';
import type { CacheTranslation } from '@/types/cache'; // Update import path

import '../../styles/CacheManagerPanel.css';
import '../../styles/DataTable.css'; // 데이터 테이블 스타일 추가
import { Tooltip, Button, Box } from '@mui/material';
import { CopyButton } from '../../components/common/CopyButton';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { Download as DownloadIcon, Upload as UploadIcon } from '@mui/icons-material';
import { CacheSearchParams } from '@/types/common';

interface CacheState {
  currentPage: number;
  itemsPerPage: number;
  itemsPerPageOptions: number[];
  customItemsPerPage: string;
  isCustomPerPageMode: boolean;
  totalItems: number;
  translations: CacheTranslation[];
  searchParams: CacheSearchParams;
  selectedTranslationId: number | null;
  translationHistory: TranslationHistory[] | null;
  isLoading: boolean;
}

// Helper type for selected translation data for modals
type SelectedTranslationData = CacheTranslation | null;

export const CacheManagerPanel: React.FC = () => {
  const [state, setState] = useState<CacheState>({
    currentPage: 1,
    itemsPerPage: 10,
    itemsPerPageOptions: [10, 20, 50, 100],
    customItemsPerPage: '',
    isCustomPerPageMode: false,
    totalItems: 0,
    translations: [],
    searchParams: {
      searchType: 'source',
      searchValue: '',
      startDate: getDefaultStartDate(),
      endDate: getDefaultEndDate(),
    },
    selectedTranslationId: null,
    translationHistory: null,
    isLoading: false,
  });

  // 체크박스 상태 관리를 useCheckboxes 훅으로 이동
  const { checkedItems, handleCheckboxChange, handleCheckAll, clearCheckedItems } =
    useCheckboxes<CacheTranslation>({
      idExtractor: (translation) => translation.id,
    });

  // 선택된 번역 데이터 상태
  const [, setSelectedTranslationData] = useState<SelectedTranslationData>(null);

  // 새로운 모달 시스템 사용
  const { openModal, closeModal } = useModal();
  const [currentDetailModalId, setCurrentDetailModalId] = useState<string | null>(null);
  const [currentHistoryModalId, setCurrentHistoryModalId] = useState<string | null>(null);

  const { openConfirmModal } = useConfirmModal();

  // 번역 데이터 로드 함수를 useCallback으로 감싸고 useEffect 전에 선언
  const loadTranslations = useCallback(
    async (
      page = state.currentPage,
      itemsPerPage = state.itemsPerPage,
      searchParams = state.searchParams
    ) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await window.electron.ipcRenderer.invoke(IpcChannel.GetTranslations, {
          page,
          itemsPerPage,
          searchParams,
        });

        setState((prev) => ({
          ...prev,
          translations: response.translations,
          totalItems: response.totalItems,
          isLoading: false,
        }));
      } catch (error) {
        console.error('번역 캐시 로드 실패:', error);
        setState((prev) => ({
          ...prev,
          translations: [],
          totalItems: 0,
          isLoading: false,
        }));
      }
    },
    [state.currentPage, state.itemsPerPage, state.searchParams]
  );

  // 컴포넌트 마운트 시 최초 한번만 번역 목록 로드
  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]); // Keep initial load effect

  // 번역 이력 로드 및 모달 열기
  const loadAndShowHistory = useCallback(
    async (translationId: number) => {
      try {
        // 이력 데이터 가져오기
        const history = await window.electron.ipcRenderer.invoke(IpcChannel.GetTranslationHistory, {
          translationId,
        });

        // 이력 데이터로 상태 업데이트
        setState((prevState) => ({
          ...prevState,
          translationHistory: history.translationHistory,
          selectedTranslationId: translationId,
        }));

        // 이전 모달이 있으면 닫기
        if (currentHistoryModalId) {
          closeModal(currentHistoryModalId);
        }

        // 새로운 모달 시스템으로 이력 모달 열기
        const modalId = openModal({
          title: '번역 이력',
          content: <TranslationHistoryModal translationHistory={history.translationHistory} />,
          size: 'medium',
          className: 'history-modal',
          onClose: () => {
            setState((prev) => ({ ...prev, translationHistory: null }));
          },
        });

        setCurrentHistoryModalId(modalId);
      } catch (error) {
        console.error('번역 이력 로드 실패:', error);
      }
    },
    [openModal, closeModal, currentHistoryModalId]
  );

  // 번역 업데이트
  const updateTranslation = useCallback(
    async (translationId: number, newTarget: string) => {
      try {
        await window.electron.ipcRenderer.invoke(IpcChannel.UpdateTranslation, {
          id: translationId,
          target: newTarget,
        });

        // 상태 업데이트: 성공 시 즉시 translations 배열 업데이트
        setState((prevState) => {
          const updatedTranslations = prevState.translations.map((t) =>
            t.id === translationId ? { ...t, target: newTarget } : t
          );
          return {
            ...prevState,
            translations: updatedTranslations, // 업데이트된 번역 목록 반영
            selectedTranslationId: null, // 선택 해제
            // isLoading: true, // loadTranslations 호출 전에 isLoading을 true로 설정하지 않음
          };
        });

        // 모달 닫기
        if (currentDetailModalId) {
          closeModal(currentDetailModalId);
          setCurrentDetailModalId(null);
        }

        // setSelectedTranslationData(null); // 이 상태는 현재 사용되지 않으므로 제거하거나 주석 처리 가능

        // 현재 페이지 상태로 데이터 다시 로드 (테이블 갱신 목적)
        loadTranslations(state.currentPage, state.itemsPerPage, state.searchParams);
      } catch (error) {
        console.error('번역 업데이트 실패:', error);
        // 에러 발생 시 사용자에게 알림 추가 가능
        openAlertModal(
          { title: '오류', message: '번역 업데이트 중 오류가 발생했습니다.' },
          openModal,
          closeModal
        );
        // 실패 시 로딩 상태 해제
        setState((prevState) => ({ ...prevState, isLoading: false }));
      }
    },
    [
      currentDetailModalId,
      closeModal,
      loadTranslations,
      state.currentPage,
      state.itemsPerPage,
      state.searchParams,
      openModal, // openAlertModal 사용을 위해 추가 (의존성 배열 확인 필요)
    ]
  );

  // 번역 상세 정보 모달 표시
  const showDetailModal = useCallback(
    (translationId: number) => {
      const selectedTranslation = state.translations.find((t) => t.id === translationId);
      if (!selectedTranslation) return;

      // 선택한 번역 데이터 상태 업데이트
      setState((prevState) => ({
        ...prevState,
        selectedTranslationId: translationId,
      }));

      setSelectedTranslationData(selectedTranslation);

      // 이전 모달이 있으면 닫기
      if (currentDetailModalId) {
        closeModal(currentDetailModalId);
      }

      // 새로운 모달 시스템으로 상세 모달 열기
      const modalId = openModal({
        title: '번역 상세 정보',
        content: (
          <TranslationDetailModal
            translation={selectedTranslation}
            onHistoryClick={() => loadAndShowHistory(selectedTranslation.id)}
            onSave={(newTarget: string) => updateTranslation(selectedTranslation.id, newTarget)}
          />
        ),
        size: 'large',
        className: 'detail-modal',
        onClose: () => {
          setState((prev) => ({ ...prev, selectedTranslationId: null }));
          setSelectedTranslationData(null);
        },
      });

      setCurrentDetailModalId(modalId);
    },
    [
      openModal,
      closeModal,
      currentDetailModalId,
      loadAndShowHistory,
      updateTranslation,
      state.translations,
    ]
  );

  // 선택한 항목 삭제
  const deleteCheckedItems = useCallback(async () => {
    if (checkedItems.size === 0) {
      openAlertModal({ message: '삭제할 항목을 선택해주세요.' }, openModal, closeModal);
      return;
    }

    // 새로운 모달 시스템 사용
    openConfirmModal({
      message: '선택한 항목을 삭제하시겠습니까?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await window.electron.ipcRenderer.invoke(IpcChannel.DeleteTranslations, {
            translationIds: Array.from(checkedItems),
          });

          // 체크박스 상태 초기화
          clearCheckedItems();

          // 상태 초기화
          setState((prevState) => ({
            ...prevState,
            selectedTranslationId: null,
            isLoading: true,
          }));

          // 모달을 닫고 선택된 데이터 정리
          if (currentDetailModalId) {
            closeModal(currentDetailModalId);
            setCurrentDetailModalId(null);
          }

          if (currentHistoryModalId) {
            closeModal(currentHistoryModalId);
            setCurrentHistoryModalId(null);
          }

          setSelectedTranslationData(null);

          // 항목 삭제 후 현재 페이지 상태로 데이터 다시 로드
          loadTranslations(state.currentPage, state.itemsPerPage, state.searchParams);
        } catch (error) {
          console.error('번역 캐시 삭제 실패:', error);
          openAlertModal(
            { message: '번역 캐시 삭제 중 오류가 발생했습니다.' },
            openModal,
            closeModal
          );
        }
      },
    });
  }, [
    checkedItems,
    clearCheckedItems,
    openConfirmModal,
    closeModal,
    currentDetailModalId,
    currentHistoryModalId,
    loadTranslations,
    state.currentPage,
    state.itemsPerPage,
    state.searchParams,
    openModal,
  ]);

  // 모든 항목 삭제
  const deleteAllItems = useCallback(async () => {
    // 새로운 모달 시스템 사용
    openConfirmModal({
      message: '검색된 모든 항목을 삭제하시겠습니까?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await window.electron.ipcRenderer.invoke(IpcChannel.DeleteAllTranslations, {
            searchParams: state.searchParams,
          });

          // 체크박스 상태 초기화
          clearCheckedItems();

          // 상태 초기화
          setState((prevState) => ({
            ...prevState,
            selectedTranslationId: null,
            isLoading: true,
          }));

          // 모달을 닫고 선택된 데이터 정리
          if (currentDetailModalId) {
            closeModal(currentDetailModalId);
            setCurrentDetailModalId(null);
          }

          if (currentHistoryModalId) {
            closeModal(currentHistoryModalId);
            setCurrentHistoryModalId(null);
          }

          setSelectedTranslationData(null);

          // 항목 삭제 후 현재 페이지 상태로 데이터 다시 로드
          loadTranslations(state.currentPage, state.itemsPerPage, state.searchParams);
        } catch (error) {
          console.error('번역 캐시 전체 삭제 실패:', error);
          openAlertModal(
            { message: '번역 캐시 삭제 중 오류가 발생했습니다.' },
            openModal,
            closeModal
          );
        }
      },
    });
  }, [
    clearCheckedItems,
    openConfirmModal,
    closeModal,
    currentDetailModalId,
    currentHistoryModalId,
    loadTranslations,
    state.currentPage,
    state.itemsPerPage,
    state.searchParams,
    openModal,
  ]);

  // 사용자 정의 페이지당 항목 수 변경 핸들러
  function handleCustomItemsPerPageChange(e: React.ChangeEvent<HTMLInputElement>) {
    setState((prevState) => ({
      ...prevState,
      customItemsPerPage: e.target.value,
    }));
  }

  // 사용자 정의 페이지당 항목 수 적용 핸들러
  function applyCustomItemsPerPage() {
    const customValue = parseInt(state.customItemsPerPage, 10);
    if (!isNaN(customValue) && customValue > 0) {
      setState((prevState) => ({
        ...prevState,
        itemsPerPage: customValue,
        currentPage: 1,
        isLoading: true,
      }));

      // 새 값을 직접 전달
      loadTranslations(1, customValue, state.searchParams);
    } else {
      openAlertModal({ message: '유효한 숫자를 입력해주세요' }, openModal, closeModal);
    }
  }

  // 사용자 정의 페이지당 항목 수 입력 필드에서 엔터 키 처리
  function handleCustomItemsPerPageKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      applyCustomItemsPerPage();
    }
  }

  // 검색 파라미터 변경 처리
  function handleSearchParamChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;

    // 검색 필터만 업데이트하고 검색은 수행하지 않음
    setState((prevState) => ({
      ...prevState,
      searchParams: {
        ...prevState.searchParams,
        [name]: value,
      },
    }));

    // 파라미터 변경 시 검색 버튼 주목성을 위한 애니메이션 추가 가능
    const searchButton = document.querySelector('.search-button') as HTMLElement;
    if (searchButton) {
      searchButton.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }],
        {
          duration: 300,
          iterations: 1,
        }
      );
    }
  }

  // 검색 전 모든 모달을 닫는 함수
  const closeAllModals = useCallback(() => {
    if (currentDetailModalId) {
      closeModal(currentDetailModalId);
      setCurrentDetailModalId(null);
    }

    if (currentHistoryModalId) {
      closeModal(currentHistoryModalId);
      setCurrentHistoryModalId(null);
    }

    setSelectedTranslationData(null);
  }, [closeModal, currentDetailModalId, currentHistoryModalId]);

  // 검색 실행 핸들러
  const handleSearch = useCallback(() => {
    // 체크박스 상태 초기화
    clearCheckedItems();

    // 모달이 열려 있으면 모두 닫기
    closeAllModals();

    // 검색 파라미터로 번역 데이터 로드
    setState((prev) => ({
      ...prev,
      currentPage: 1,
      isLoading: true,
    }));

    loadTranslations(1, state.itemsPerPage, state.searchParams);
  }, [clearCheckedItems, closeAllModals, loadTranslations, state.itemsPerPage, state.searchParams]);

  // 날짜 변경 처리
  function handleDateChange(
    e: React.ChangeEvent<HTMLInputElement>,
    dateType: 'startDate' | 'endDate'
  ) {
    const value = e.target.value;
    const formattedDate = value ? value.replace(/-/g, '/') : '';

    // 검색 필터만 업데이트하고 검색은 수행하지 않음
    setState((prevState) => ({
      ...prevState,
      searchParams: {
        ...prevState.searchParams,
        [dateType]: formattedDate,
      },
    }));

    // 파라미터 변경 시 검색 버튼 주목성을 위한 애니메이션 추가 가능
    const searchButton = document.querySelector('.search-button') as HTMLElement;
    if (searchButton) {
      searchButton.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }],
        {
          duration: 300,
          iterations: 1,
        }
      );
    }
  }

  // 페이지 변경 처리
  const handlePageChange = useCallback(
    (newPage: number) => {
      // 페이지 변경 시 체크박스 상태 초기화
      clearCheckedItems();

      setState((prevState) => ({
        ...prevState,
        currentPage: newPage,
        isLoading: true,
      }));

      // 새 페이지 값을 직접 전달
      loadTranslations(newPage, state.itemsPerPage, state.searchParams);
    },
    [clearCheckedItems, loadTranslations, state.itemsPerPage, state.searchParams]
  );

  // 페이지당 항목 수 변경 핸들러
  const handleItemsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      // 항목 수 변경 시 체크박스 상태 초기화
      clearCheckedItems();

      const value = e.target.value;

      if (value === 'custom') {
        // 사용자 정의 값 선택 시 현재 itemsPerPage 값을 customItemsPerPage에 설정
        setState((prevState) => ({
          ...prevState,
          customItemsPerPage: prevState.itemsPerPage.toString(),
          isCustomPerPageMode: true,
        }));
      } else {
        const newItemsPerPage = parseInt(value, 10);
        setState((prevState) => ({
          ...prevState,
          itemsPerPage: newItemsPerPage,
          currentPage: 1,
          customItemsPerPage: '',
          isCustomPerPageMode: false,
          isLoading: true,
        }));

        // 새 값을 직접 전달
        loadTranslations(1, newItemsPerPage, state.searchParams);
      }
    },
    [clearCheckedItems, loadTranslations, state.searchParams]
  );

  // 번역 내보내기
  const handleExportTranslations = useCallback(async () => {
    try {
      const response = await window.electron.ipcRenderer.invoke(IpcChannel.ExportTranslations, {
        searchParams: state.searchParams,
      });

      if (response.success && response.translations) {
        // JSON 파일로 저장
        const blob = new Blob([JSON.stringify(response.translations, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);

        // 파일명에 검색 조건 추가
        let fileName = `translations_${new Date().toISOString().split('T')[0]}`;

        // 검색 조건이 있는 경우 파일명에 추가
        if (state.searchParams.searchType !== 'date' && state.searchParams.searchValue) {
          const searchValue = state.searchParams.searchValue
            .replace(/[^a-zA-Z0-9가-힣]/g, '_')
            .substring(0, 30);
          fileName += `_${state.searchParams.searchType}_${searchValue}`;
        }

        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        openAlertModal(
          { title: '성공', message: '번역이 성공적으로 내보내졌습니다.' },
          openModal,
          closeModal
        );
      } else {
        openAlertModal(
          { title: '오류', message: response.message || '번역 내보내기 중 오류가 발생했습니다.' },
          openModal,
          closeModal
        );
      }
    } catch (error) {
      console.error('번역 내보내기 실패:', error);
      openAlertModal(
        { title: '오류', message: '번역 내보내기 중 오류가 발생했습니다.' },
        openModal,
        closeModal
      );
    }
  }, [state.searchParams, openModal, closeModal]);

  // 번역 가져오기
  const handleImportTranslations = useCallback(async () => {
    try {
      // 파일 선택 다이얼로그 열기
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          const fileContent = await file.text();
          const translations = JSON.parse(fileContent);

          const response = await window.electron.ipcRenderer.invoke(IpcChannel.ImportTranslations, {
            translations,
          });

          if (response.success) {
            openAlertModal(
              {
                title: '성공',
                message: `${response.updatedCount}개의 번역이 성공적으로 업데이트되었습니다.`,
              },
              openModal,
              closeModal
            );

            // 번역 목록 새로고침
            loadTranslations();
          } else {
            openAlertModal(
              {
                title: '오류',
                message: response.message || '번역 가져오기 중 오류가 발생했습니다.',
              },
              openModal,
              closeModal
            );
          }
        } catch (error) {
          console.error('파일 처리 중 오류:', error);
          openAlertModal(
            { title: '오류', message: '파일 처리 중 오류가 발생했습니다.' },
            openModal,
            closeModal
          );
        }
      };

      input.click();
    } catch (error) {
      console.error('번역 가져오기 실패:', error);
      openAlertModal(
        { title: '오류', message: '번역 가져오기 중 오류가 발생했습니다.' },
        openModal,
        closeModal
      );
    }
  }, [loadTranslations, openModal, closeModal]);

  return (
    <div className="cache-manager-panel">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <h2>번역 캐시 관리</h2>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportTranslations}
          >
            내보내기
          </Button>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={handleImportTranslations}>
            가져오기
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <SearchSection
          searchParams={state.searchParams}
          onSearchParamChange={handleSearchParamChange}
          onDateChange={handleDateChange}
          onSearch={handleSearch}
        />
      </Box>

      {state.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <div className="loading-state">데이터를 불러오는 중...</div>
        </Box>
      ) : state.translations.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <div className="empty-state">검색 결과가 없습니다.</div>
        </Box>
      ) : (
        <DataTable
          items={state.translations}
          columns={[
            {
              key: 'id',
              header: 'ID',
              width: '50px',
            },
            {
              key: 'source',
              header: '원문',
              width: '30%',
              getCellValue: (translation) => translation.source,
            },
            {
              key: 'target',
              header: '번역',
              width: '30%',
              getCellValue: (translation) => translation.target,
            },
            {
              key: 'fileName',
              header: '파일',
              width: '15%',
              render: (translation) =>
                translation.fileName ? (
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
                ),
            },
            {
              key: 'createdAt',
              header: '생성일',
              width: '100px',
              render: (translation) => new Date(translation.createdAt).toLocaleDateString(),
            },
            {
              key: 'actions',
              header: '액션',
              width: '80px',
              render: (translation) => (
                <button
                  className="action-link history"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadAndShowHistory(translation.id);
                  }}
                >
                  이력
                </button>
              ),
            },
          ]}
          idExtractor={(translation) => translation.id}
          checkedItems={checkedItems}
          onCheckboxChange={handleCheckboxChange}
          onCheckAll={(checked) => handleCheckAll(state.translations, checked)}
          onRowClick={showDetailModal}
          onDeleteCheckedItems={deleteCheckedItems}
          onDeleteAllItems={deleteAllItems}
          isLoading={state.isLoading}
          emptyMessage="검색 결과가 없습니다."
          className="cache-table-container"
        />
      )}

      {state.translations.length > 0 && (
        <PaginationSection
          currentPage={state.currentPage}
          itemsPerPage={state.itemsPerPage}
          itemsPerPageOptions={state.itemsPerPageOptions}
          customItemsPerPage={state.customItemsPerPage}
          isCustomPerPageMode={state.isCustomPerPageMode}
          totalItems={state.totalItems}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          onCustomItemsPerPageChange={handleCustomItemsPerPageChange}
          onCustomItemsPerPageKeyDown={handleCustomItemsPerPageKeyDown}
          applyCustomItemsPerPage={applyCustomItemsPerPage}
        />
      )}
    </div>
  );
};

export default CacheManagerPanel;
