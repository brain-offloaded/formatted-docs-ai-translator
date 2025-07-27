import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Divider, Snackbar } from '@mui/material';
import { TranslationType, useTranslation } from '../../contexts/TranslationContext';
import { usePresets } from '../../contexts/PresetContext';
import { getTranslationTypeLabel } from '../../constants/TranslationTypeMapping';
import { BaseParseOptionsDto } from '../../../nest/parser/dto/options/base-parse-options.dto';
import ActionToolbar from './components/ActionToolbar';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';

export default function TranslateView(): React.ReactElement {
  const {
    translationType,
    setTranslationType,
    handleClearFiles,
    uiState,
    setResultState,
    isTranslating,
  } = useTranslation();
  const { fetchPresets } = usePresets();
  const [parserOptions, setParserOptions] = useState<BaseParseOptionsDto | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const handleOptionsChange = useCallback((options: BaseParseOptionsDto) => {
    setParserOptions((prevOptions) => {
      if (JSON.stringify(prevOptions) === JSON.stringify(options)) {
        return prevOptions;
      }
      return options;
    });
  }, []);

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  const handleTranslationTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newType = e.target.value as TranslationType;
      if (newType === translationType) return;

      setTranslationType(newType);
      handleClearFiles();
      setResultState({
        translationResult: null,
        zipBlob: null,
        singleFileBlob: null,
        singleFileName: null,
      });
      setParserOptions(null);
      setShowSettings(false);
    },
    [setTranslationType, handleClearFiles, setResultState, translationType]
  );

  const translationTypeLabel = useMemo(
    () => getTranslationTypeLabel(translationType),
    [translationType]
  );

  return (
    <Box sx={{ position: 'relative' }}>
      <Card sx={{ borderRadius: '12px', p: 2 }}>
        <CardContent>
          <Typography variant="h6" mb={2} fontWeight="medium">
            {translationTypeLabel}
          </Typography>
          <Divider sx={{ my: 2 }} />

          <ActionToolbar
            translationType={translationType}
            handleTranslationTypeChange={handleTranslationTypeChange}
            isTranslating={isTranslating}
          />

          <InputPanel
            translationType={translationType}
            isTranslating={isTranslating}
            parserOptions={parserOptions}
            handleOptionsChange={handleOptionsChange}
            showSettings={showSettings}
            toggleSettings={toggleSettings}
            translationTypeLabel={translationTypeLabel}
          />

          <OutputPanel />
        </CardContent>
      </Card>
      <Snackbar
        open={uiState.snackbarOpen}
        autoHideDuration={4000}
        message={uiState.snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
