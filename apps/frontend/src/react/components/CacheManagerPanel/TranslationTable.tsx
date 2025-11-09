import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { CopyButton } from '../common/CopyButton';
import { truncateText } from '../../utils/textUtils';
import type { CacheTranslationDto } from '@/react/api/generated';

interface TranslationTableProps {
  translations: CacheTranslationDto[];
  isLoading?: boolean;
  searchValue?: string;
  searchType?: string;
  checkedItems: Set<number>;
  onCheckboxChange: (id: number, checked: boolean) => void;
  onCheckAll: (checked: boolean) => void;
  onRowClick?: (id: number) => void;
  onShowTranslationDetail?: (translation: CacheTranslationDto) => void;
  onShowHistory?: (id: number) => void;
  onLoadTranslationHistory?: (id: number) => void;
  onDeleteCheckedItems: () => void;
  onDeleteAllItems: () => void;
}

/**
 * 레거시 캐시 번역 테이블.
 * DataTable로 대체되었지만, 다른 화면에서 재사용 가능성을 고려해 MUI 스타일로 정비.
 */
const TranslationTableInner: React.FC<TranslationTableProps> = ({
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
  const isAllChecked = useMemo(() => {
    if (translations.length === 0) return false;
    return translations.every((translation) => checkedItems.has(translation.id));
  }, [translations, checkedItems]);

  if (isLoading) {
    return (
      <Paper variant="outlined" sx={{ py: 8 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary">
            데이터를 불러오는 중입니다...
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (translations.length === 0) {
    const message =
      searchValue || searchType === 'date'
        ? '검색 결과가 없습니다.'
        : '저장된 번역 캐시가 없습니다.';

    return (
      <Paper variant="outlined" sx={{ py: 8 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          {message}
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        justifyContent="flex-end"
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <Button variant="contained" color="error" onClick={onDeleteCheckedItems}>
          선택 항목 삭제
        </Button>
        <Button variant="outlined" color="error" onClick={onDeleteAllItems}>
          검색된 항목 모두 삭제
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={isAllChecked}
                  onChange={(event) => onCheckAll(event.target.checked)}
                  inputProps={{ 'aria-label': '전체 선택' }}
                  indeterminate={checkedItems.size > 0 && !isAllChecked}
                />
              </TableCell>
              <TableCell sx={{ width: 80 }} align="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  ID
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  원문
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  번역
                </Typography>
              </TableCell>
              <TableCell sx={{ width: 140 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  캐시 태그
                </Typography>
              </TableCell>
              <TableCell sx={{ width: 140 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  생성일
                </Typography>
              </TableCell>
              <TableCell sx={{ width: 120 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  액션
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {translations.map((translation) => {
              const sourceCellId = `legacy-source-${translation.id}`;
              const targetCellId = `legacy-target-${translation.id}`;

              return (
                <TableRow
                  key={translation.id}
                  hover
                  sx={{ cursor: onRowClick || onShowTranslationDetail ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (onRowClick) {
                      onRowClick(translation.id);
                    } else if (onShowTranslationDetail) {
                      onShowTranslationDetail(translation);
                    }
                  }}
                >
                  <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={checkedItems.has(translation.id)}
                      onChange={(event) => onCheckboxChange(translation.id, event.target.checked)}
                      inputProps={{ 'aria-label': `${translation.id} 선택` }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {translation.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                      <Tooltip title={translation.source} arrow disableInteractive>
                        <Typography
                          component="span"
                          variant="body2"
                          noWrap
                          id={sourceCellId}
                          sx={{ flex: 1, minWidth: 0 }}
                        >
                          {truncateText(translation.source)}
                        </Typography>
                      </Tooltip>
                      <CopyButton
                        targetSelector={`#${sourceCellId}`}
                        targetValue={translation.source}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                      <Tooltip title={translation.target} arrow disableInteractive>
                        <Typography
                          component="span"
                          variant="body2"
                          noWrap
                          id={targetCellId}
                          sx={{ flex: 1, minWidth: 0 }}
                        >
                          {truncateText(translation.target)}
                        </Typography>
                      </Tooltip>
                      <CopyButton
                        targetSelector={`#${targetCellId}`}
                        targetValue={translation.target}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {translation.cacheTag || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {new Date(translation.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        if (onShowHistory) {
                          onShowHistory(translation.id);
                        } else if (onLoadTranslationHistory) {
                          onLoadTranslationHistory(translation.id);
                        }
                      }}
                    >
                      이력
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export const TranslationTable = React.memo(TranslationTableInner);
export default TranslationTable;
