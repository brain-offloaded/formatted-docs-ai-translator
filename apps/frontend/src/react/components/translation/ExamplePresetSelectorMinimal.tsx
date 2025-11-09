import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useTranslation } from 'react-i18next';
import { ExamplePresetDto, ExamplePresetsService } from '@/react/api/generated';
import { useTranslation as useTranslationContext } from '../../contexts/TranslationContext';

interface ExamplePresetSelectorMinimalProps {
  currentPresetName: string;
  onPresetChange: (event: SelectChangeEvent<string>) => void;
  isTranslating: boolean;
  isPresetLoading: boolean;
  setIsPresetLoading: (loading: boolean) => void;
}

const ExamplePresetSelectorMinimal: React.FC<ExamplePresetSelectorMinimalProps> = ({
  currentPresetName,
  onPresetChange,
  isTranslating,
  isPresetLoading,
  setIsPresetLoading,
}) => {
  const [examplePresets, setExamplePresets] = useState<ExamplePresetDto[]>([]);
  const { showSnackbar } = useTranslationContext();
  const { t } = useTranslation();

  const fetchExamplePresets = useCallback(async () => {
    try {
      setIsPresetLoading(true);
      const response = await ExamplePresetsService.examplePresetControllerGetExamplePresets();
      if (response.success) {
        setExamplePresets(response.presets);
      } else {
        showSnackbar(t('examplePreset.loadFailed', { message: response.message }));
      }
    } catch (error) {
      console.error('프리셋 불러오기 중 오류 발생:', error);
      const errorMessage = error instanceof Error ? error.message : t('errors.unknown');
      showSnackbar(t('examplePreset.loadError', { message: errorMessage }));
    } finally {
      setIsPresetLoading(false);
    }
  }, [setIsPresetLoading, showSnackbar, t]);

  useEffect(() => {
    fetchExamplePresets();
  }, [fetchExamplePresets]);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        {t('examplePreset.title')}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="example-preset-minimal-label">
            {t('examplePreset.selectLabel')}
          </InputLabel>
          <Select
            labelId="example-preset-minimal-label"
            id="example-preset-minimal"
            value={currentPresetName}
            onChange={onPresetChange}
            label={t('examplePreset.selectLabel')}
            disabled={isTranslating || isPresetLoading || examplePresets.length === 0}
          >
            {!isPresetLoading && examplePresets.length === 0 && (
              <MenuItem value="" disabled>
                {t('examplePreset.noPresets')}
              </MenuItem>
            )}
            {!isPresetLoading &&
              examplePresets.map((preset) => (
                <MenuItem key={preset.id} value={preset.name}>
                  <Tooltip
                    title={(preset.description as unknown as string) || ''}
                    placement="right"
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography>{preset.name}</Typography>
                    </Box>
                  </Tooltip>
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        {isPresetLoading && <CircularProgress size={24} />}
      </Box>
    </Box>
  );
};

export default ExamplePresetSelectorMinimal;
