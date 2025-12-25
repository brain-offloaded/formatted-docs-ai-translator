import React from 'react';
import { useTranslation } from 'react-i18next';
import { useConfigStore } from '../../config/config-store';
import { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';
import { DynamicOptions } from './DynamicOptions';
import { Box, Tooltip, IconButton, Typography, FormControlLabel, Switch } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { BaseParseOptionsProps } from '../../types/translation-types';
import { useParseOptionsController } from './hooks/useParseOptionsController';

export const BaseParseOptions = <T extends BaseParseOptionsDto = BaseParseOptionsDto>({
  onOptionsChange,
  initialOptions, // This is the state from the parent (parserOptions)
  translationType,
  isTranslating,
  optionItems,
  label,
  showSettings, // props로 showSettings 받기
  onToggleSettings, // props로 onToggleSettings 받기
  showFileToggle = true,
}: BaseParseOptionsProps<T>): React.ReactElement => {
  const { t } = useTranslation();
  const sourceLanguage = useConfigStore((state) => state.sourceLanguage);
  const {
    combinedOptionItems,
    handleDynamicOptionsChange,
    handleFileToggle,
    optionsValues,
    isFileChecked,
  } = useParseOptionsController<T>({
    translationType,
    initialOptions: initialOptions ?? null,
    onOptionsChange,
    sourceLanguage,
    optionItems,
  });

  return (
    <Box
      sx={{
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        p: 2,
        bgcolor: '#f5f5f5',
        mb: 2,
      }}
    >
      {/* Settings Icon and Label */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {label && <Typography variant="body1">{label}</Typography>}
        <Tooltip title={t('baseParseOptions.tooltip')}>
          <IconButton
            size="small"
            onClick={onToggleSettings}
            color={showSettings ? 'primary' : 'default'}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Settings Panel */}
      {showSettings && (
        <Box sx={{ mb: 2 }}>
          <DynamicOptions
            options={combinedOptionItems}
            values={optionsValues}
            onChange={handleDynamicOptionsChange}
            disabled={isTranslating || !initialOptions}
          />
        </Box>
      )}

      {showFileToggle && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <FormControlLabel
            control={
              <Switch
                checked={isFileChecked}
                onChange={handleFileToggle}
                disabled={isTranslating}
              />
            }
            label={t('baseParseOptions.filePathMode')}
          />
        </Box>
      )}
    </Box>
  );
};

export default BaseParseOptions;
