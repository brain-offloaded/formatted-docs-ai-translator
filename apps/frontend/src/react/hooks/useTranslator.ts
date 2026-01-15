import { useCallback, useMemo } from 'react';
import { useTranslation, TranslationType } from '../contexts/TranslationContext';
import { useTranslation as useI18n } from 'react-i18next';
import { useConfigStore } from '../config/config-store';
import { AiTranslatorConfig } from '@/react/types/config';
import { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';
import { getDefaultValidatorByMode } from '../constants/TranslationTypeMapping';
import { BaseTranslatorOptions } from '../components/translators/BaseTranslator';
import { translationStrategyFactory } from '../factories/translation-strategy-factory';
import { TranslatorEngine } from '../unified/engine/translator-engine';
import { useTranslatorInput } from './translator/useTranslatorInput';
import { useCacheTagGuard } from './translator/useCacheTagGuard';
import { useFileDownloader } from './translator/useFileDownloader';
import { useDownloadController } from './translator/useDownloadController';
import { useTranslationRunner } from './translator/useTranslationRunner';

export interface UseTranslatorOptions<T extends BaseParseOptionsDto> {
  initialOptions: BaseTranslatorOptions;
  translationType: TranslationType;
  parserOptions?: T | null;
  promptPresetContent?: string;
}

export type UseTranslatorResult = ReturnType<typeof useTranslator>;

export const useTranslator = <T extends BaseParseOptionsDto>({
  initialOptions,
  translationType,
  parserOptions,
  promptPresetContent,
}: UseTranslatorOptions<T>) => {
  const modelProvider = useConfigStore((state) => state.modelProvider);
  const sourceLanguage = useConfigStore((state) => state.sourceLanguage);
  const targetLanguage = useConfigStore((state) => state.targetLanguage);
  const customModelConfig = useConfigStore((state) => state.customModelConfig);
  const apiKey = useConfigStore((state) => state.apiKey);
  const baseUrl = useConfigStore((state) => state.baseUrl);
  const lastPresetName = useConfigStore((state) => state.lastPresetName);
  const selectedModelPresetId = useConfigStore((state) => state.selectedModelPresetId);
  const useThinking = useConfigStore((state) => state.useThinking);
  const thinkingLevel = useConfigStore((state) => state.thinkingLevel);
  const thinkingBudget = useConfigStore((state) => state.thinkingBudget);
  const setThinkingBudget = useConfigStore((state) => state.setThinkingBudget);
  const providerSettings = useConfigStore((state) => state.providerSettings);
  const cacheTag = useConfigStore((state) => state.cacheTag);
  const beginnerModeEnabled = useConfigStore((state) => state.beginnerModeEnabled);

  const config: AiTranslatorConfig = useMemo(
    () => ({
      modelProvider,
      sourceLanguage,
      targetLanguage,
      customModelConfig,
      apiKey,
      baseUrl,
      cacheTag,
      beginnerModeEnabled,
      selectedModelPresetId,
      lastPresetName,
      useThinking,
      thinkingLevel,
      thinkingBudget,
      setThinkingBudget,
      providerSettings,
    }),
    [
      modelProvider,
      sourceLanguage,
      targetLanguage,
      customModelConfig,
      apiKey,
      baseUrl,
      lastPresetName,
      selectedModelPresetId,
      useThinking,
      thinkingLevel,
      thinkingBudget,
      setThinkingBudget,
      providerSettings,
      cacheTag,
      beginnerModeEnabled,
    ]
  );

  const { input, currentIsFileInput, handleInputChange, handleFileChange, resetInput } =
    useTranslatorInput({ parserOptions });

  const {
    isTranslating,
    setIsTranslating,
    resultState,
    setResultState,
    uiState,
    setUIState,
    isConfigValid,
    showSnackbar,
    handleClearFiles,
    getJobManager,
    cancelTranslation,
    resetJobManager,
  } = useTranslation();

  const { t } = useI18n();

  const validateInput = useMemo(
    () =>
      initialOptions.validateInput || getDefaultValidatorByMode(translationType as TranslationType),
    [initialOptions.validateInput, translationType]
  );

  const handleClearFilesLocal = useCallback(() => {
    resetInput();
    handleClearFiles();
  }, [resetInput, handleClearFiles]);

  const isTranslateButtonDisabled = useMemo(() => {
    if (isTranslating) return true;
    if (!isConfigValid) return true;
    return !validateInput(input);
  }, [isTranslating, isConfigValid, validateInput, input]);

  const translatorEngine = useMemo(() => {
    const strategy = translationStrategyFactory.create(translationType);
    return new TranslatorEngine(strategy);
  }, [translationType]);

  const ensureCacheTagExists = useCacheTagGuard(
    cacheTag,
    sourceLanguage,
    targetLanguage,
    showSnackbar
  );

  const downloadFile = useFileDownloader(showSnackbar);

  const { handleDownload, shouldShowDownloadButton } = useDownloadController({
    resultState,
    currentIsFileInput,
    downloadFile,
    showSnackbar,
  });

  const handleTranslate = useTranslationRunner({
    input,
    config,
    translationType,
    validateInput,
    translatorEngine,
    parserOptions,
    promptPresetContent,
    currentIsFileInput,
    isTranslating,
    setIsTranslating,
    setResultState,
    setUIState,
    getJobManager,
    resetJobManager,
    ensureCacheTagExists,
    showSnackbar,
    t,
  });

  const handleCancel = useCallback(() => {
    cancelTranslation();
    showSnackbar(t('translationRunner.cancelled'));
  }, [cancelTranslation, showSnackbar, t]);

  return {
    input,
    handleInputChange,
    handleFileChange,
    handleClearFilesLocal,
    isTranslating,
    isTranslateButtonDisabled,
    handleTranslate,
    handleCancel,
    resultState,
    uiState,
    setUIState,
    handleDownload,
    shouldShowDownloadButton,
    currentIsFileInput,
  };
};
