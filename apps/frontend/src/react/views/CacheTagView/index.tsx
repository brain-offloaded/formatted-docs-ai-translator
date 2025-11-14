import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';

import type { CacheTagSummaryDto, DeleteCacheTagBodyDto } from '@/react/api/generated';
import { DEFAULT_CACHE_TAG } from '@apps/common/dist/constants/cache';
import { useSnackbar } from '@/react/hooks/useSnackbar';
import { useTranslation } from 'react-i18next';
import { useConfirmModal } from '@/react/components/common/ConfirmModal';
import { useModal, createModalId } from '@/react/contexts/ModalContext';
import { CacheTagsService } from '@/react/api/generated';
import { InfoTooltip } from '@/react/components/common/InfoTooltip';
import { getWikiUrl } from '@/react/utils/wiki';

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : '-');

const CacheTagView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [cacheTags, setCacheTags] = useState<CacheTagSummaryDto[]>([]);
  const [allCacheTags, setAllCacheTags] = useState<CacheTagSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'lastUsedAt' | 'name' | 'createdAt'>('lastUsedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const {
    isOpen: isSnackbarOpen,
    message: snackbarMessage,
    showSnackbar,
    closeSnackbar,
  } = useSnackbar();
  const { openConfirmModal } = useConfirmModal();
  const { openModal } = useModal();

  const loadCacheTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const requestPayload = {
        keyword: keyword.trim().length > 0 ? keyword.trim() : undefined,
        sortBy,
        sortOrder,
      } as const;

      const response = await CacheTagsService.cacheTagsControllerGetCacheTags(requestPayload);
      if (response.success) {
        setCacheTags(response.cacheTags ?? []);
        // 전체 태그 목록도 저장 (필터링 없이)
        if (!keyword.trim()) {
          setAllCacheTags(response.cacheTags ?? []);
        }
      } else {
        setCacheTags([]);
        setError(response.message || t('cacheTag.loadFailed'));
      }
    } catch (err) {
      console.error('캐시 태그 조회 실패:', err);
      setError(t('cacheTag.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [keyword, sortBy, sortOrder, t]);

  useEffect(() => {
    loadCacheTags();
  }, [loadCacheTags]);

  const defaultTagExists = useMemo(
    () => allCacheTags.some((tag) => tag.name === DEFAULT_CACHE_TAG),
    [allCacheTags]
  );

  const totalTagCount = useMemo(() => cacheTags.length, [cacheTags]);

  const handleSearchSubmit = useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      setKeyword(searchInput.trim());
    },
    [searchInput]
  );

  const handleResetFilters = useCallback(() => {
    setSearchInput('');
    setKeyword('');
    setSortBy('lastUsedAt');
    setSortOrder('desc');
  }, []);

  const handleDelete = useCallback(
    (tag: CacheTagSummaryDto) => {
      if (tag.name === DEFAULT_CACHE_TAG) {
        showSnackbar(t('cacheTag.cannotDeleteDefault'));
        return;
      }

      if (tag.translationCount > 0) {
        void (async () => {
          try {
            const response = await CacheTagsService.cacheTagsControllerGetCacheTags({});
            if (!response.success) {
              throw new Error(response.message || t('cacheTag.deleteFailed'));
            }

            const latestTags = response.cacheTags ?? [];
            setAllCacheTags(latestTags);

            openModal({
              id: createModalId('cache.deleteTag', String(tag.id)),
              type: 'cache.deleteTag',
              payload: {
                tag,
                cacheTags: latestTags.filter((candidate) => candidate.id !== tag.id),
                onSubmit: async (action) => {
                  if (action.mode === 'skip') {
                    return;
                  }

                  if (action.mode === 'reassign' && !action.targetTagId) {
                    throw new Error(t('cacheTag.deleteReassignMissingTarget'));
                  }

                  setDeletingId(tag.id);
                  try {
                    const result = await CacheTagsService.cacheTagsControllerDeleteCacheTag({
                      id: tag.id,
                      requestBody: {
                        mode: action.mode as DeleteCacheTagBodyDto['mode'],
                        targetTagId: action.targetTagId,
                      },
                    });

                    if (!result.success) {
                      throw new Error(result.message || t('cacheTag.deleteFailed'));
                    }

                    setError(null);
                    showSnackbar(
                      action.mode === 'cascade'
                        ? t('cacheTag.deleteCascadeSuccess')
                        : t('cacheTag.deleteReassignSuccess')
                    );
                    await loadCacheTags();
                  } catch (submitError) {
                    const message =
                      submitError instanceof Error
                        ? submitError.message
                        : t('cacheTag.deleteError');
                    setError(message);
                    showSnackbar(message);
                    throw submitError instanceof Error ? submitError : new Error(message);
                  } finally {
                    setDeletingId(null);
                  }
                },
              },
            });
          } catch (loadError) {
            console.error('캐시 태그 삭제 옵션 준비 실패:', loadError);
            const message =
              loadError instanceof Error ? loadError.message : t('cacheTag.deleteError');
            setError(message);
            showSnackbar(message);
          }
        })();
        return;
      }

      openConfirmModal({
        title: t('cacheTag.deleteCacheTag'),
        message: t('cacheTag.deleteConfirm', { tagName: tag.name }),
        confirmText: t('common.delete'),
        cancelText: t('common.cancel'),
        variant: 'danger',
        onConfirm: () => {
          void (async () => {
            setDeletingId(tag.id);
            try {
              const response = await CacheTagsService.cacheTagsControllerDeleteCacheTag({
                id: tag.id,
                requestBody: { mode: 'strict' as DeleteCacheTagBodyDto['mode'] },
              });

              if (response.success) {
                showSnackbar(t('cacheTag.deleteSuccess'));
                await loadCacheTags();
              } else {
                const message = response.message || t('cacheTag.deleteFailed');
                setError(message);
                showSnackbar(message);
              }
            } catch (err) {
              console.error('캐시 태그 삭제 실패:', err);
              const message = t('cacheTag.deleteError');
              setError(message);
              showSnackbar(message);
            } finally {
              setDeletingId(null);
            }
          })();
        },
      });
    },
    [loadCacheTags, openConfirmModal, openModal, showSnackbar, t]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="h3">
          {t('cacheTag.registeredCacheTags')}
          <InfoTooltip
            title={t('tooltips.cacheTag')}
            infoAriaLabel={t('tooltips.aria.info', { subject: t('cacheTag.tagName') })}
            wikiUrl={getWikiUrl('cacheGuide', i18n.language)}
            wikiAriaLabel={t('tooltips.links.cacheGuide')}
          />
        </Typography>
        <Tooltip title={t('cacheTag.reload')}>
          <span>
            <IconButton onClick={loadCacheTags} disabled={isLoading} color="primary">
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}></Box>

      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('cacheTag.tagCount')}
              </Typography>
              <Typography variant="h4" component="p">
                {totalTagCount}
              </Typography>
            </Box>
            <Box sx={{ flex: 2, width: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('cacheTag.defaultTagStatus')}
              </Typography>
              {defaultTagExists ? (
                <Chip label={t('cacheTag.defaultTagRegistered')} color="primary" />
              ) : (
                <Chip label={t('cacheTag.defaultTagNotRegistered')} color="warning" />
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack
            component="form"
            direction="row"
            spacing={2}
            alignItems="flex-end"
            flexWrap="wrap"
            onSubmit={handleSearchSubmit}
          >
            <TextField
              label={t('cacheTag.searchTagName')}
              placeholder={t('cacheTag.enterTagName')}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              size="small"
              sx={{ flex: '1 1 200px', minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="cache-tag-sort-label">{t('cacheTag.sortBy')}</InputLabel>
              <Select
                labelId="cache-tag-sort-label"
                label={t('cacheTag.sortBy')}
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as 'lastUsedAt' | 'name' | 'createdAt')
                }
              >
                <MenuItem value="lastUsedAt">{t('cacheTag.lastUsedAt')}</MenuItem>
                <MenuItem value="name">{t('cacheTag.name')}</MenuItem>
                <MenuItem value="createdAt">{t('cacheTag.createdAt')}</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="cache-tag-sort-order-label">{t('cacheTag.sortOrder')}</InputLabel>
              <Select
                labelId="cache-tag-sort-order-label"
                label={t('cacheTag.sortOrder')}
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as 'asc' | 'desc')}
              >
                <MenuItem value="desc">{t('cacheTag.descending')}</MenuItem>
                <MenuItem value="asc">{t('cacheTag.ascending')}</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained" disableElevation>
                {t('cacheTag.search')}
              </Button>
              <Button type="button" variant="outlined" onClick={handleResetFilters}>
                {t('cacheTag.reset')}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : cacheTags.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
          {t('cacheTag.noRegisteredCacheTags')}
        </Box>
      ) : (
        <TableContainer component={Card} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('cacheTag.tagName')}</TableCell>
                <TableCell>{t('cacheTag.createdAt')}</TableCell>
                <TableCell>{t('cacheTag.lastModifiedAt')}</TableCell>
                <TableCell>{t('cacheTag.lastUsedAt')}</TableCell>
                <TableCell align="right">{t('cacheTag.savedTranslationCount')}</TableCell>
                <TableCell align="center">{t('cacheTag.manage')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cacheTags.map((tag) => (
                <TableRow key={tag.id} hover>
                  <TableCell>
                    {tag.name === DEFAULT_CACHE_TAG ? (
                      <Chip label={tag.name} color="primary" size="small" />
                    ) : (
                      tag.name
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(tag.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(tag.updatedAt)}</TableCell>
                  <TableCell>{formatDateTime(tag.lastUsedAt)}</TableCell>
                  <TableCell align="right">{tag.translationCount.toLocaleString()}</TableCell>
                  <TableCell align="center">
                    <Tooltip
                      title={
                        tag.name === DEFAULT_CACHE_TAG
                          ? t('cacheTag.cannotDeleteDefault')
                          : t('cacheTag.deleteCacheTag')
                      }
                    >
                      <span>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(tag)}
                          disabled={tag.name === DEFAULT_CACHE_TAG || deletingId === tag.id}
                        >
                          {deletingId === tag.id ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <DeleteIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Snackbar
        open={isSnackbarOpen}
        message={snackbarMessage}
        autoHideDuration={3000}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default CacheTagView;
