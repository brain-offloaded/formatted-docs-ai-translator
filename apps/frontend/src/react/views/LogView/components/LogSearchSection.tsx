import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Paper, Stack, TextField, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';
type LogLevelTranslationKey =
  | 'logSearch.levelError'
  | 'logSearch.levelWarn'
  | 'logSearch.levelInfo'
  | 'logSearch.levelDebug';

interface Props {
  levels: string[];
  onToggleLevel: (level: string, checked: boolean) => void;
  startDate: string;
  endDate: string;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
}

const LEVEL_CONFIG: Record<LogLevel, { labelKey: LogLevelTranslationKey; helper?: string }> = {
  error: { labelKey: 'logSearch.levelError' },
  warn: { labelKey: 'logSearch.levelWarn' },
  info: { labelKey: 'logSearch.levelInfo' },
  debug: { labelKey: 'logSearch.levelDebug' },
};

export const LogSearchSection: React.FC<Props> = ({
  levels,
  onToggleLevel,
  startDate,
  endDate,
  onDateChange,
  onSearch,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const getLevelStyles = React.useCallback(
    (level: LogLevel, isActive: boolean) => {
      const palette = {
        error: theme.palette.error.main,
        warn: theme.palette.warning.main,
        info: theme.palette.info.main,
        debug: theme.palette.success.main,
      }[level];

      return {
        borderColor: alpha(palette, 0.4),
        color: isActive ? theme.palette.getContrastText(palette) : palette,
        backgroundColor: isActive ? palette : alpha(palette, 0.08),
        '&:hover': {
          backgroundColor: isActive ? palette : alpha(palette, 0.16),
          borderColor: alpha(palette, 0.5),
        },
      };
    },
    [theme]
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <Stack spacing={2}>
        <div>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {t('logSearch.levelFilter')}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {(Object.keys(LEVEL_CONFIG) as LogLevel[]).map((level) => {
              const isActive = levels.includes(level);
              return (
                <Button
                  key={level}
                  size="small"
                  variant={isActive ? 'contained' : 'outlined'}
                  onClick={() => onToggleLevel(level, !isActive)}
                  sx={{
                    borderWidth: 1,
                    textTransform: 'none',
                    fontWeight: 500,
                    ...getLevelStyles(level, isActive),
                  }}
                >
                  {t(LEVEL_CONFIG[level].labelKey)}
                </Button>
              );
            })}
          </Stack>
        </div>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <TextField
            type="date"
            label={t('logSearch.startDate')}
            name="startDate"
            value={startDate}
            onChange={onDateChange}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: { xs: '100%', sm: 220 } }}
          />
          <TextField
            type="date"
            label={t('logSearch.endDate')}
            name="endDate"
            value={endDate}
            onChange={onDateChange}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: { xs: '100%', sm: 220 } }}
          />
          <Button
            variant="contained"
            onClick={onSearch}
            sx={{
              height: { sm: 40 },
              alignSelf: { xs: 'flex-start', sm: 'center' },
            }}
          >
            {t('logSearch.search')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default LogSearchSection;
