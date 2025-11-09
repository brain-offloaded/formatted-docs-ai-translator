import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Checkbox,
  Chip,
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
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { formatRelativeDate } from '../../../utils/dateUtils';
import type { LogListItem } from '../types';

interface Props {
  logs: LogListItem[];
  checkedItems: Set<number>;
  onCheckboxChange: (id: number, checked: boolean) => void;
  onCheckAll: (checked: boolean) => void;
  onRowClick: (id: number) => void;
  onDeleteCheckedItems?: () => void;
  onDeleteAllItems?: () => void;
  openLogDetailModal: (log: LogListItem) => void;
}

const LEVEL_COLOR_MAP = {
  error: 'error',
  warn: 'warning',
  info: 'info',
  debug: 'success',
} as const;

export const LogTable: React.FC<Props> = ({
  logs,
  checkedItems,
  onCheckboxChange,
  onCheckAll,
  onRowClick,
  onDeleteCheckedItems,
  onDeleteAllItems,
  openLogDetailModal,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const allChecked = logs.length > 0 && logs.every((log) => checkedItems.has(log.id));
  const indeterminate = checkedItems.size > 0 && !allChecked;

  const renderTextCell = (text?: string | null) => {
    const safeText = text ?? '-';

    return (
      <Tooltip title={safeText} arrow disableInteractive>
        <Typography variant="body2" noWrap sx={{ display: 'block', width: '100%' }}>
          {safeText}
        </Typography>
      </Tooltip>
    );
  };

  const renderLevelChip = (log: LogListItem) => {
    const levelKey = log.level.toLowerCase() as keyof typeof LEVEL_COLOR_MAP;
    const paletteColor = theme.palette[LEVEL_COLOR_MAP[levelKey] ?? 'info'];
    const background = alpha(paletteColor.main, 0.12);

    return (
      <Chip
        label={log.level}
        size="small"
        sx={{
          fontWeight: 600,
          textTransform: 'uppercase',
          color: paletteColor.main,
          backgroundColor: background,
        }}
      />
    );
  };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
      <Stack spacing={2} sx={{ p: 2 }}>
        {(onDeleteCheckedItems || onDeleteAllItems) && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            justifyContent="flex-end"
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            {onDeleteCheckedItems && (
              <Button variant="contained" color="error" onClick={onDeleteCheckedItems}>
                {t('logTable.deleteSelected')}
              </Button>
            )}
            {onDeleteAllItems && (
              <Button variant="outlined" color="error" onClick={onDeleteAllItems}>
                {t('logTable.deleteAllSearched')}
              </Button>
            )}
          </Stack>
        )}

        <TableContainer>
          <Table size="small" sx={{ minWidth: 650, tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={indeterminate}
                    checked={allChecked}
                    onChange={(e) => onCheckAll(e.target.checked)}
                    inputProps={{ 'aria-label': t('logTable.selectAll') }}
                  />
                </TableCell>
                <TableCell sx={{ width: 140 }}>{t('logTable.time')}</TableCell>
                <TableCell sx={{ width: 120 }}>{t('logTable.level')}</TableCell>
                <TableCell sx={{ width: '38%', maxWidth: 420 }}>{t('logTable.message')}</TableCell>
                <TableCell sx={{ width: '32%', maxWidth: 360 }}>{t('logTable.metadata')}</TableCell>
                <TableCell align="right" sx={{ width: 140 }}>
                  {t('logTable.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow
                  key={log.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => onRowClick(log.id)}
                >
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={checkedItems.has(log.id)}
                      onChange={(e) => onCheckboxChange(log.id, e.target.checked)}
                      inputProps={{ 'aria-label': t('logTable.selectLog', { id: log.id }) }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {formatRelativeDate(log.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>{renderLevelChip(log)}</TableCell>
                  <TableCell sx={{ width: '38%', maxWidth: 420 }}>
                    {renderTextCell(log.message)}
                  </TableCell>
                  <TableCell sx={{ width: '32%', maxWidth: 360 }}>
                    {renderTextCell(log.metadataPreview)}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLogDetailModal(log);
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 500,
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                    >
                      {t('logTable.viewDetails')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Paper>
  );
};

export default LogTable;
