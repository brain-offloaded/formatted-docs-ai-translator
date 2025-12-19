import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useConfigStore } from '@/react/config/config-store';
import { useTranslation } from '@/react/contexts/TranslationContext';
import { TranslatorAiSettingsDto } from '@/react/api/generated/models/TranslatorAiSettingsDto';

const ModelProvider = TranslatorAiSettingsDto.modelProvider;
type ModelProvider = TranslatorAiSettingsDto['modelProvider'];

const sanitizeApiKey = (value: string) => value.replace(/[\r\n]+/g, ' ');

export const useSettingsForm = () => {
  const config = useConfigStore();
  const customModelConfig = useConfigStore((state) => state.customModelConfig);
  const updateConfig = useConfigStore((state) => state.updateConfig);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');
  const { setIsConfigValid } = useTranslation();

  const toggleApiKeyVisibility = useCallback(() => {
    setIsApiKeyVisible((prev) => !prev);
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleProviderChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const newProvider = event.target.value as ModelProvider;
      updateConfig({ modelProvider: newProvider });
    },
    [updateConfig]
  );

  const updateCustomModelConfig = useCallback(
    (partial: Partial<typeof customModelConfig>) => {
      updateConfig({
        customModelConfig: {
          ...customModelConfig,
          ...partial,
        },
      });
    },
    [customModelConfig, updateConfig]
  );

  const handleApiKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = sanitizeApiKey(event.target.value);
      if (nextValue && nextValue.length < 3) {
        setApiKeyError('API 키가 너무 짧습니다. 유효한 키인지 확인해주세요.');
      } else {
        setApiKeyError('');
      }
      updateConfig({ apiKey: nextValue });
    },
    [updateConfig]
  );

  const handleBaseUrlChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateConfig({ baseUrl: event.target.value.trim() });
    },
    [updateConfig]
  );

  const isCustomConfigFilled = useMemo(() => {
    const { apiKey } = config;
    const requiresBaseUrl = config.modelProvider === ModelProvider.OPENAI_COMPATIBLE;
    return Boolean(
      apiKey &&
        customModelConfig.modelName &&
        customModelConfig.requestsPerMinute &&
        customModelConfig.maxOutputTokenCount &&
        customModelConfig.maxConcurrentRequests &&
        (!requiresBaseUrl || config.baseUrl)
    );
  }, [config, customModelConfig]);

  useEffect(() => {
    setIsConfigValid(isCustomConfigFilled && apiKeyError.length === 0);
  }, [apiKeyError.length, isCustomConfigFilled, setIsConfigValid]);

  return {
    config,
    isApiKeyVisible,
    expanded,
    apiKeyError,
    toggleApiKeyVisibility,
    toggleExpanded,
    handleProviderChange,
    handleApiKeyChange,
    handleBaseUrlChange,
    updateCustomModelConfig,
    updateConfig,
  };
};
