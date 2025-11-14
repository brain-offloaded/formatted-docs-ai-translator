import React from 'react';
import { PaginationSection } from '../../components/CacheManagerPanel/PaginationSection';
import { SearchSection } from '../../components/CacheManagerPanel/SearchSection';
import { DataTable } from '../../components/common/DataTable';
import {
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  Box,
} from '@mui/material';
import { useCacheManager } from './hooks/useCacheManager';
import { useTranslation } from 'react-i18next';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { CopyButton } from '../../components/common/CopyButton';
import { truncateText } from '../../utils/textUtils';
import { InfoTooltip } from '../../components/common/InfoTooltip';
import { getWikiUrl } from '@/react/utils/wiki';

const CacheManagerPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    state,
    checkedItems,
    handleCheckboxChange,
    handleCheckAll,
    showDetailModal,
    deleteCheckedItems,
    deleteAllItems,
    handleCustomItemsPerPageChange,
    applyCustomItemsPerPage,
    handleCustomItemsPerPageKeyDown,
    handleSearchParamChange,
    handleSearch,
    handleDateChange,
    handlePageChange,
    handleItemsPerPageChange,
    renderExportImportButtons,
    searchButtonRef,
  } = useCacheManager();

  const hasTranslations = state.translations.length > 0;

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
      >
        <Typography variant="h4" fontWeight={600} component="div">
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            {t('cache.translationCacheManagement')}
            <InfoTooltip
              title={t('tooltips.cacheManager')}
              infoAriaLabel={t('tooltips.aria.info', {
                subject: t('cache.translationCacheManagement'),
              })}
              wikiUrl={getWikiUrl('cacheGuide', i18n.language)}
              wikiAriaLabel={t('tooltips.links.cacheGuide')}
            />
          </Box>
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {renderExportImportButtons()}
        </Stack>
      </Stack>

      <SearchSection
        searchParams={state.searchParams}
        onSearchParamChange={handleSearchParamChange}
        onDateChange={handleDateChange}
        onSearch={handleSearch}
        searchButtonRef={searchButtonRef}
        cacheTags={state.cacheTags}
      />

      {state.isLoading ? (
        <Paper variant="outlined" sx={{ py: 8 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              {t('cache.loadingData')}
            </Typography>
          </Stack>
        </Paper>
      ) : !hasTranslations ? (
        <Paper variant="outlined" sx={{ py: 8 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            {t('cache.noResults')}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          <DataTable
            items={state.translations}
            columns={[
              {
                key: 'id',
                header: t('cache.id'),
                width: 80,
                align: 'center',
                render: (translation) => (
                  <Typography variant="body2" color="text.secondary">
                    {translation.id}
                  </Typography>
                ),
              },
              {
                key: 'source',
                header: t('cache.source'),
                width: '32%',
                getCellValue: (translation) => translation.source,
              },
              {
                key: 'target',
                header: t('cache.target'),
                width: '32%',
                render: (translation) => {
                  const rawValue = translation.target ?? '';
                  const hasValue = Boolean(rawValue);
                  const displayValue = hasValue ? truncateText(rawValue) : '-';
                  const cellId = `cache-target-${translation.id}`;

                  return (
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
                      <Tooltip title={rawValue} arrow disableInteractive>
                        <Typography
                          component="span"
                          variant="body2"
                          noWrap
                          id={cellId}
                          sx={{ flex: 1, minWidth: 0 }}
                        >
                          {displayValue}
                        </Typography>
                      </Tooltip>
                      {hasValue && (
                        <CopyButton
                          size="small"
                          targetSelector={`#${cellId}`}
                          targetValue={rawValue}
                        />
                      )}
                      <Tooltip title={t('cache.openDetail')} arrow>
                        <IconButton
                          size="small"
                          aria-label={t('cache.openDetail')}
                          onClick={(event) => {
                            event.stopPropagation();
                            showDetailModal(translation.id);
                          }}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  );
                },
              },
              {
                key: 'cacheTag',
                header: t('cache.cacheTag'),
                width: '12%',
                getCellValue: (translation) => translation.cacheTag,
              },
              {
                key: 'createdAt',
                header: t('cache.createdAt'),
                width: 140,
                render: (translation) => (
                  <Typography variant="body2" color="text.secondary">
                    {new Date(translation.createdAt).toLocaleDateString()}
                  </Typography>
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
            emptyMessage={t('cache.noResults')}
          />

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
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
          </Paper>
        </Stack>
      )}
    </Stack>
  );
};

export default CacheManagerPanel;
