import React from 'react';
import { useTranslation } from 'react-i18next';
import { CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { LogTable } from './components/LogTable';
import { LogPagination } from './components/LogPagination';
import { LogSearchSection } from './components/LogSearchSection';
import { useLogViewerController } from './hooks/useLogViewerController';

const LogViewer: React.FC = () => {
  const { t } = useTranslation();
  const {
    state,
    pagination,
    checkedItems,
    handleCheckboxChange,
    handleCheckAll,
    clearCheckedItems,
    openLogDetailModal,
    handleLogLevelChange,
    handleSearchParamChange,
    handleSearch,
    handleDeleteCheckedLogs,
    handleDeleteAllLogs,
  } = useLogViewerController();

  const openDetail = React.useCallback(
    (logId: number) => {
      const target = state.logs.find((item) => item.id === logId);
      if (!target) return;
      openLogDetailModal(target);
    },
    [openLogDetailModal, state.logs]
  );

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={600} component="h2">
        {t('log.title')}
      </Typography>

      <LogSearchSection
        levels={state.searchParams.levels}
        onToggleLevel={handleLogLevelChange}
        startDate={state.searchParams.startDate}
        endDate={state.searchParams.endDate}
        onDateChange={handleSearchParamChange}
        onSearch={handleSearch}
      />

      {state.isLoading ? (
        <Paper sx={{ py: 8 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              {t('log.loading')}
            </Typography>
          </Stack>
        </Paper>
      ) : state.logs.length === 0 ? (
        <Paper sx={{ py: 8 }}>
          <Typography variant="body2" align="center" color="text.secondary">
            {t('log.noLogs')}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          <LogTable
            logs={state.logs}
            checkedItems={checkedItems}
            onCheckboxChange={handleCheckboxChange}
            onCheckAll={(checked) => handleCheckAll(state.logs, checked)}
            onRowClick={openDetail}
            onDeleteCheckedItems={handleDeleteCheckedLogs}
            onDeleteAllItems={handleDeleteAllLogs}
            openLogDetailModal={openLogDetailModal}
          />

          {state.logs.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <LogPagination
                pagination={pagination}
                totalItems={state.totalItems}
                clearCheckedItems={clearCheckedItems}
              />
            </Paper>
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default LogViewer;
