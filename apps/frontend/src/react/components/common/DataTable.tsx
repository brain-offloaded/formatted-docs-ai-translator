import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Checkbox,
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
import type { TableCellProps } from '@mui/material/TableCell';
import { useTranslation } from 'react-i18next';
import { CopyButton } from './CopyButton';
import { truncateText } from '../../utils/textUtils';

interface DataTableColumn<T> {
  key: string;
  header: string;
  width?: string | number;
  align?: TableCellProps['align'];
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DataTable = <T extends Record<string, any>>(props: DataTableProps<T>) => {
  const { t } = useTranslation();
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
    emptyMessage,
    actionButtons,
  } = props;

  const isAllChecked = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((item) => checkedItems.has(idExtractor(item)));
  }, [items, checkedItems, idExtractor]);

  const indeterminate = checkedItems.size > 0 && !isAllChecked;

  if (isLoading) {
    return (
      <Paper variant="outlined" sx={{ py: 8 }}>
        <Typography variant="body2" align="center" color="text.secondary">
          {t('dataTable.loading')}
        </Typography>
      </Paper>
    );
  }

  if (items.length === 0) {
    return (
      <Paper variant="outlined" sx={{ py: 8 }}>
        <Typography variant="body2" align="center" color="text.secondary">
          {emptyMessage || t('dataTable.noData')}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
      <Stack spacing={2} sx={{ p: 2 }}>
        {(onDeleteCheckedItems || onDeleteAllItems || actionButtons) && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            justifyContent="flex-end"
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            {onDeleteCheckedItems && (
              <Button variant="contained" color="error" onClick={onDeleteCheckedItems}>
                {t('dataTable.deleteSelected')}
              </Button>
            )}
            {onDeleteAllItems && (
              <Button variant="outlined" color="error" onClick={onDeleteAllItems}>
                {t('dataTable.deleteAll')}
              </Button>
            )}
            {actionButtons}
          </Stack>
        )}

        <TableContainer>
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isAllChecked}
                    indeterminate={indeterminate}
                    onChange={(event) => onCheckAll(event.target.checked)}
                    inputProps={{ 'aria-label': t('dataTable.selectAll') }}
                  />
                </TableCell>
                {columns.map((column) => (
                  <TableCell key={column.key} sx={{ width: column.width }} align={column.align}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {column.header}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => {
                const rowId = idExtractor(item);
                return (
                  <TableRow
                    key={rowId}
                    hover
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                    onClick={() => onRowClick && onRowClick(rowId)}
                  >
                    <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        checked={checkedItems.has(rowId)}
                        onChange={(event) => onCheckboxChange(rowId, event.target.checked)}
                        inputProps={{ 'aria-label': t('dataTable.select', { id: rowId }) }}
                      />
                    </TableCell>
                    {columns.map((column) => {
                      const cellId = `${column.key}-${rowId}`;
                      const rawValue = column.getCellValue ? column.getCellValue(item) : null;
                      const hasValue = Boolean(rawValue);
                      const displayValue = hasValue ? truncateText(rawValue) : '-';

                      return (
                        <TableCell
                          key={column.key}
                          align={column.align}
                          sx={{ width: column.width }}
                        >
                          {column.render ? (
                            column.render(item, index)
                          ) : column.getCellValue ? (
                            <Box
                              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}
                            >
                              <Tooltip title={rawValue ?? ''} arrow disableInteractive>
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
                                  targetValue={rawValue ?? ''}
                                />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" noWrap>
                              {String(item[column.key] ?? '-')}
                            </Typography>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Paper>
  );
};

export default DataTable;
