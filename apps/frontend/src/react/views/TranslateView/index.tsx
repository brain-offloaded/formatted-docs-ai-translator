import React from 'react';
import { Box, Card, CardContent, Divider, Snackbar, Typography } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { SourceLanguage, TargetLanguage } from '@apps/common/dist/language';
import { useTranslation } from '@/react/contexts/TranslationContext';
import { useConfigStore } from '@/react/config/config-store';
import { useExamplePresetLoader } from './hooks/useExamplePresetLoader';
import { usePromptPresetLoader } from './hooks/usePromptPresetLoader';
import { useOptionsPanel } from './hooks/useOptionsPanel';
import { useTranslatorFactories } from './hooks/useTranslatorFactories';
import { useTranslationViewController } from './hooks/useTranslationViewController';
import { TranslationPresetsSection } from './components/TranslationPresetsSection';
import { TranslationSettingsPanel } from './components/TranslationSettingsPanel';
import { TranslatorRenderer } from './components/TranslatorRenderer';

export default function TranslateView(): React.ReactElement {
  const {
    translationType,
    setTranslationType,
    handleClearFiles,
    uiState,
    setResultState,
    isTranslating,
    showSnackbar,
  } = useTranslation();
  const {
    sourceLanguage,
    targetLanguage,
    lastPresetName,
    lastPromptPresetName,
    lastTextPromptPresetName,
    lastImagePromptPresetName,
    cacheTag,
    updateConfig,
  } = useConfigStore();

  const examplePresetHandlers = useExamplePresetLoader({
    lastPresetName,
    updateConfig,
    showSnackbar,
  });
  const promptPresetHandlers = usePromptPresetLoader({
    translationType,
    lastPromptPresetName,
    lastTextPromptPresetName,
    lastImagePromptPresetName,
    updateConfig,
    showSnackbar,
  });
  const { showSettings, toggleSettings, resetSettingsVisibility } = useOptionsPanel();

  const { parserOptions, handleOptionsChange, handleTranslationTypeChange } =
    useTranslationViewController({
      translationType,
      setTranslationType,
      handleClearFiles,
      setResultState,
      resetPromptPreset: promptPresetHandlers.resetPromptPreset,
      resetExamplePreset: examplePresetHandlers.resetExamplePreset,
      resetSettingsVisibility,
    });

  const { translatorConfig, TranslatorComponent, OptionComponent, translationTypeLabel } =
    useTranslatorFactories(translationType);

  const handleSourceLanguageChange = (event: SelectChangeEvent<SourceLanguage>) => {
    const newSourceLanguage = event.target.value as SourceLanguage;
    updateConfig({ sourceLanguage: newSourceLanguage });
  };

  const handleTargetLanguageChange = (event: SelectChangeEvent<TargetLanguage>) => {
    const newTargetLanguage = event.target.value as TargetLanguage;
    updateConfig({ targetLanguage: newTargetLanguage });
  };

  const handleCacheTagChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({ cacheTag: event.target.value });
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Card sx={{ borderRadius: '12px', p: 2 }}>
        <CardContent>
          <Typography variant="h6" mb={2} fontWeight="medium">
            {translationTypeLabel}
          </Typography>
          <Divider sx={{ my: 2 }} />

          <TranslationPresetsSection
            translationType={translationType}
            isTranslating={isTranslating}
            examplePreset={{
              currentPresetName: examplePresetHandlers.currentExamplePresetName,
              isPresetLoading: examplePresetHandlers.isExamplePresetLoading,
              setIsPresetLoading: examplePresetHandlers.setIsExamplePresetLoading,
              onPresetChange: examplePresetHandlers.handleExamplePresetChange,
            }}
            promptPreset={{
              currentPresetName: promptPresetHandlers.currentPromptPresetName,
              isPresetLoading: promptPresetHandlers.isPromptPresetLoading,
              setIsPresetLoading: promptPresetHandlers.setIsPromptPresetLoading,
              onPresetChange: promptPresetHandlers.handlePromptPresetChange,
            }}
          />

          <TranslationSettingsPanel
            translationType={translationType}
            translationTypeLabel={translationTypeLabel}
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            cacheTag={cacheTag}
            isTranslating={isTranslating}
            onSourceLanguageChange={handleSourceLanguageChange}
            onTargetLanguageChange={handleTargetLanguageChange}
            onCacheTagChange={handleCacheTagChange}
            onTranslationTypeChange={handleTranslationTypeChange}
            OptionComponent={OptionComponent}
            optionComponentProps={{
              isTranslating,
              onOptionsChange: handleOptionsChange,
              initialOptions: parserOptions || undefined,
              showSettings,
              onToggleSettings: toggleSettings,
            }}
          />

          <TranslatorRenderer
            translationType={translationType}
            translatorConfig={translatorConfig}
            TranslatorComponent={TranslatorComponent}
            parserOptions={parserOptions}
            promptPresetContent={promptPresetHandlers.promptPresetContent ?? null}
            currentPromptPresetName={promptPresetHandlers.currentPromptPresetName}
            onPromptPresetChange={promptPresetHandlers.handlePromptPresetChange}
            isPromptPresetLoading={promptPresetHandlers.isPromptPresetLoading}
            setIsPromptPresetLoading={promptPresetHandlers.setIsPromptPresetLoading}
          />
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
