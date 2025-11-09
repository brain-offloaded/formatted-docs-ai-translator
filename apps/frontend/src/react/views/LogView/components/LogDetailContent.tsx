import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import { CopyButton } from '../../../components/common/CopyButton';
import type { LogDetail } from '../types';

const LEVEL_COLOR_MAP = {
  error: 'error',
  warn: 'warning',
  info: 'info',
  debug: 'success',
} as const;

const createCodeBlock = (label: string, value: string, copyValue: string, theme: Theme) => (
  <Stack spacing={1}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="subtitle1" fontWeight={600}>
        {label}
      </Typography>
      <CopyButton targetValue={copyValue} />
    </Stack>
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 2,
        borderRadius: 1,
        bgcolor: alpha(theme.palette.background.default, 0.6),
        border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: 400,
        overflowY: 'auto',
      }}
    >
      {value}
    </Box>
  </Stack>
);

interface LogDetailContentProps {
  log: LogDetail | null;
  isLoading: boolean;
  error?: string;
  onRetry?: () => void;
}

export const LogDetailContent: React.FC<LogDetailContentProps> = ({
  log,
  isLoading,
  error,
  onRetry,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  if (!log) {
    return (
      <Stack spacing={2} sx={{ minWidth: { xs: '100%', sm: 480 } }}>
        <Alert severity="info">{t('logDetail.noData')}</Alert>
      </Stack>
    );
  }

  const levelKey = log.level.toLowerCase() as keyof typeof LEVEL_COLOR_MAP;
  const paletteColor = theme.palette[LEVEL_COLOR_MAP[levelKey] ?? 'info'];
  const levelChip = (
    <Chip
      label={log.level}
      size="small"
      sx={{
        fontWeight: 600,
        textTransform: 'uppercase',
        color: paletteColor.main,
        backgroundColor: alpha(paletteColor.main, 0.12),
      }}
    />
  );

  const metadataString = log.meta
    ? JSON.stringify(log.meta, null, 2)
    : (log.metadata ?? log.metadataPreview ?? '');

  return (
    <Stack spacing={3} sx={{ minWidth: { xs: '100%', sm: 480 } }}>
      {error && (
        <Alert
          severity="error"
          action={
            onRetry ? (
              <Button color="inherit" size="small" onClick={onRetry}>
                {t('logDetail.retry')}
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      )}

      {isLoading && !error && (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} thickness={5} />
          <Typography variant="body2" color="text.secondary">
            {t('logDetail.loading')}
          </Typography>
        </Stack>
      )}

      <Stack spacing={1.5}>
        <Typography variant="h6" fontWeight={600}>
          {t('logDetail.title')}
        </Typography>
        <Divider />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap">
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              ID
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {log.id}
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              {t('logDetail.level')}
            </Typography>
            {levelChip}
          </Stack>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              {t('logDetail.moduleContext')}
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {log.module || log.context || '-'}
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              {t('logDetail.timestamp')}
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {new Date(log.timestamp).toLocaleString()}
            </Typography>
          </Stack>
        </Stack>
      </Stack>

      {createCodeBlock(t('logDetail.message'), log.message, log.message, theme)}

      {log.stack && createCodeBlock(t('logDetail.stackTrace'), log.stack, log.stack, theme)}

      {metadataString &&
        createCodeBlock(t('logDetail.metadata'), metadataString, metadataString, theme)}
    </Stack>
  );
};

export default LogDetailContent;
