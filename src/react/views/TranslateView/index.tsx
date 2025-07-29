import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { Language, SourceLanguage } from '../../../utils/language';
import { TranslationType, useTranslation } from '../../contexts/TranslationContext';
import { ConfigStore } from '../../config/config-store';
import { IpcChannel } from '../../../nest/common/ipc.channel';
import { getTranslationTypeLabel } from '../../constants/TranslationTypeMapping';
import { TranslatorFactory } from '../../factories/TranslatorFactory';
import { ParseOptionsFactory } from '../../factories/ParseOptionsFactory';
import ExamplePresetSelectorMinimal from '../../components/translation/ExamplePresetSelectorMinimal';
import PromptPresetSelectorMinimal from '../../components/translation/PromptPresetSelectorMinimal';
import TranslationTypeSelector from '../../components/common/TranslationTypeSelector';
import { BaseParseOptionsDto } from '../../../nest/parser/dto/options/base-parse-options.dto';
import { ExamplePresetDto } from '../../../nest/translation/example/dto/example-preset.dto';

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
  const configStore = ConfigStore.getInstance();
  const [currentExamplePresetName, setCurrentExamplePresetName] = useState<string>('');
  const [isExamplePresetLoading, setIsExamplePresetLoading] = useState(false);
  const [currentPromptPresetName, setCurrentPromptPresetName] = useState<string>('');
  const [promptPresetContent, setPromptPresetContent] = useState<string | undefined>(undefined);
  const [isPromptPresetLoading, setIsPromptPresetLoading] = useState(false);
  const [parserOptions, setParserOptions] = useState<BaseParseOptionsDto | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState<SourceLanguage>(() => {
    return configStore.getConfig().sourceLanguage;
  });

  const handleSourceLanguageChange = (e: SelectChangeEvent<Language>) => {
    const newSourceLanguage = e.target.value as SourceLanguage;
    setSourceLanguage(newSourceLanguage);
    configStore.updateConfig({
      sourceLanguage: newSourceLanguage,
    });
  };

  useEffect(() => {
    const loadInitialExamplePreset = async () => {
      try {
        setIsExamplePresetLoading(true);
        const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetExamplePresets);
        if (result.success && result.presets.length > 0) {
          const presets: ExamplePresetDto[] = result.presets;
          const config = configStore.getConfig();
          const savedPresetName = config.lastPresetName || result.currentPreset;
          const presetExists = presets.some((preset) => preset.name === savedPresetName);
          const targetPresetName = presetExists ? savedPresetName : presets[0].name;

          setCurrentExamplePresetName(targetPresetName);

          if (targetPresetName !== result.currentPreset) {
            const loadResult = await window.electron.ipcRenderer.invoke(
              IpcChannel.LoadExamplePreset,
              { name: targetPresetName }
            );
            if (!loadResult.success) {
              console.warn(`초기 예제 프리셋(${targetPresetName}) 로드 실패:`, loadResult.message);
            } else {
              configStore.updateConfig({ lastPresetName: targetPresetName });
            }
          } else {
            configStore.updateConfig({ lastPresetName: targetPresetName });
          }
        } else if (!result.success) {
          showSnackbar(`초기 예제 프리셋 목록 불러오기 실패: ${result.message}`);
        }
      } catch (error) {
        console.error('초기 예제 프리셋 로드 중 오류 발생:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        showSnackbar(`초기 예제 프리셋 로드 중 오류가 발생했습니다: ${errorMessage}`);
      } finally {
        setIsExamplePresetLoading(false);
      }
    };

    if (!currentExamplePresetName) {
      loadInitialExamplePreset();
    }
  }, [configStore, currentExamplePresetName, showSnackbar]);

  useEffect(() => {
    const loadInitialPromptPreset = async () => {
      try {
        setIsPromptPresetLoading(true);
        const config = configStore.getConfig();
        const savedPresetName = config.lastPromptPresetName;

        if (savedPresetName) {
          const listResult = await window.electron.ipcRenderer.invoke(IpcChannel.GetPromptPresets);

          if (listResult.success && listResult.presets) {
            const foundPreset = listResult.presets.find((p) => p.name === savedPresetName);

            if (foundPreset) {
              const detailResult = await window.electron.ipcRenderer.invoke(
                IpcChannel.GetPromptPresetDetail,
                { id: foundPreset.id }
              );

              if (detailResult.success && detailResult.preset) {
                setCurrentPromptPresetName(detailResult.preset.name);
                setPromptPresetContent(detailResult.preset.prompt);
                showSnackbar(`'${detailResult.preset.name}' 프롬프트 프리셋을 로드했습니다.`);
              } else {
                console.warn(`초기 프롬프트 프리셋 상세 정보 로드 실패:`, detailResult.message);
                setCurrentPromptPresetName('');
                setPromptPresetContent(undefined);
              }
            } else {
              console.warn(
                `저장된 프롬프트 프리셋 이름(${savedPresetName})에 해당하는 프리셋을 찾을 수 없습니다.`
              );
              setCurrentPromptPresetName('');
              setPromptPresetContent(undefined);
            }
          } else {
            console.warn(`프롬프트 프리셋 목록 불러오기 실패:`, listResult.message);
            setCurrentPromptPresetName('');
            setPromptPresetContent(undefined);
          }
        }
      } catch (error) {
        console.error('초기 프롬프트 프리셋 로드 중 오류 발생:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        showSnackbar(`초기 프롬프트 프리셋 로드 중 오류가 발생했습니다: ${errorMessage}`);
        setCurrentPromptPresetName('');
        setPromptPresetContent(undefined);
      } finally {
        setIsPromptPresetLoading(false);
      }
    };

    if (!currentPromptPresetName) {
      loadInitialPromptPreset();
    }
  }, [configStore, currentPromptPresetName, showSnackbar]);

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
      setCurrentPromptPresetName('');
      setPromptPresetContent(undefined);
    },
    [setTranslationType, handleClearFiles, setResultState, translationType]
  );

  const handleExamplePresetChange = useCallback(
    async (event: SelectChangeEvent<string>) => {
      const newPresetName = event.target.value;
      if (newPresetName === currentExamplePresetName) return;

      try {
        setIsExamplePresetLoading(true);
        const result = await window.electron.ipcRenderer.invoke(IpcChannel.LoadExamplePreset, {
          name: newPresetName,
        });

        if (result.success) {
          setCurrentExamplePresetName(newPresetName);
          configStore.updateConfig({ lastPresetName: newPresetName });
          showSnackbar(`'${newPresetName}' 예제 프리셋을 로드했습니다.`);
        } else {
          showSnackbar(`예제 프리셋 로드 실패: ${result.message}`);
        }
      } catch (error) {
        console.error('예제 프리셋 로드 중 오류 발생:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        showSnackbar(`예제 프리셋 로드 중 오류가 발생했습니다: ${errorMessage}`);
      } finally {
        setIsExamplePresetLoading(false);
      }
    },
    [showSnackbar, configStore, currentExamplePresetName]
  );

  const handlePromptPresetChange = useCallback(
    (presetName: string, presetContent: string | undefined) => {
      setCurrentPromptPresetName(presetName);
      setPromptPresetContent(presetContent);
      configStore.updateConfig({ lastPromptPresetName: presetName });
    },
    [configStore]
  );

  const translatorConfig = useMemo(
    () => TranslatorFactory.getConfig(translationType),
    [translationType]
  );

  const TranslatorComponent = useMemo(
    () => TranslatorFactory.createTranslator(translationType),
    [translationType]
  );

  const OptionComponent = useMemo(
    () => ParseOptionsFactory.createParseOptions(translationType),
    [translationType]
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

          <ExamplePresetSelectorMinimal
            currentPresetName={currentExamplePresetName}
            onPresetChange={handleExamplePresetChange}
            isTranslating={isTranslating}
            isPresetLoading={isExamplePresetLoading}
            setIsPresetLoading={setIsExamplePresetLoading}
          />

          <PromptPresetSelectorMinimal
            currentPresetName={currentPromptPresetName}
            onPresetChange={handlePromptPresetChange}
            isTranslating={isTranslating}
            isPresetLoading={isPromptPresetLoading}
            setIsPresetLoading={setIsPromptPresetLoading}
          />

          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel id="source-language-label">원본 언어</InputLabel>
              <Select
                labelId="source-language-label"
                id="source-language"
                value={sourceLanguage}
                onChange={handleSourceLanguageChange}
                label="원본 언어"
              >
                <MenuItem value={Language.ENGLISH}>영어</MenuItem>
                <MenuItem value={Language.JAPANESE}>일본어</MenuItem>
                <MenuItem value={Language.CHINESE}>중국어</MenuItem>
              </Select>
            </FormControl>

            <TranslationTypeSelector
              selectedType={translationType}
              onChange={handleTranslationTypeChange}
            />

            {OptionComponent && (
              <OptionComponent
                isTranslating={isTranslating}
                onOptionsChange={handleOptionsChange}
                initialOptions={parserOptions || undefined}
                translationType={translationType}
                label={translationTypeLabel + ' 옵션'}
                showSettings={showSettings}
                onToggleSettings={toggleSettings}
              />
            )}

            {translatorConfig && (
              <TranslatorComponent
                key={translationType}
                options={translatorConfig.options}
                parserOptions={parserOptions}
                promptPresetContent={promptPresetContent}
              />
            )}
          </Box>
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
