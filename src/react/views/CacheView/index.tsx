import React, { useEffect, useState } from 'react';
import { TranslationTable } from '../../components/CacheManagerPanel/TranslationTable';
import { CacheTranslation } from '../../../types/cache';
import { IpcChannel } from '../../../nest/common/ipc.channel';

const CacheView = () => {
  const [translations, setTranslations] = useState<CacheTranslation[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke(IpcChannel.GetTranslations, {
        page: 1,
        itemsPerPage: 20, // 기본 페이지 당 항목 수
        searchParams: {
          searchType: 'source',
          searchValue: '',
          startDate: '',
          endDate: '',
        },
      })
      .then(({ translations, totalItems }) => {
        setTranslations(translations);
        setTotal(totalItems);
      });
  }, []);

  const handlePageChange = (page: number, pageSize: number) => {
    console.log('Page changed:', { page, pageSize });
    // 페이지 변경 시 데이터 다시 로드하는 로직 추가 예정
  };

  const handleDelete = (ids: number[]) => {
    console.log('Delete items:', ids);
    // 선택된 항목 삭제 로직 추가 예정
  };

  const handleExport = (format: 'json' | 'csv') => {
    console.log('Export format:', format);
    // 데이터 내보내기 로직 추가 예정
  };

  return (
    <TranslationTable
      translations={translations}
      total={total}
      onPageChange={handlePageChange}
      onDelete={handleDelete}
      onExport={handleExport}
      checkedItems={new Set()}
      onCheckboxChange={() => {}}
      onCheckAll={() => {}}
      onDeleteCheckedItems={() => {}}
      onDeleteAllItems={() => {}}
    />
  );
};

export default CacheView;
