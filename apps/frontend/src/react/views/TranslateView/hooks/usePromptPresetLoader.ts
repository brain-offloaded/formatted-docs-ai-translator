import { useCallback, useEffect, useState } from 'react';

import { PromptPresetDto } from '@/react/api/generated/models/PromptPresetDto';
import { TranslationType } from '@/react/contexts/TranslationContext';
import { PromptPresetsService } from '@/react/api/generated/services/PromptPresetsService';
import { useTranslation } from 'react-i18next';
import {
  containsLegacyTranslatedTextKey,
  LEGACY_TRANSLATED_TEXT_WARNING_MESSAGE,
} from '@/react/utils/legacy-prompt-warning';

interface Deps {
  translationType: TranslationType;
  lastPromptPresetName?: string; // legacy
  lastTextPromptPresetName?: string;
  lastImagePromptPresetName?: string;
  updateConfig: (partial: Record<string, unknown>) => void;
  showSnackbar: (msg: string) => void;
}

export const usePromptPresetLoader = ({
  translationType,
  lastPromptPresetName,
  lastTextPromptPresetName,
  lastImagePromptPresetName,
  updateConfig,
  showSnackbar,
}: Deps) => {
  const [currentPromptPresetName, setCurrentPromptPresetName] = useState<string>('');
  const [promptPresetContent, setPromptPresetContent] = useState<string | undefined>(undefined);
  const [isPromptPresetLoading, setIsPromptPresetLoading] = useState(false);
  const { t } = useTranslation();
  const getLegacyWarningMessage = useCallback(
    (message?: string) =>
      containsLegacyTranslatedTextKey(message)
        ? (message ?? LEGACY_TRANSLATED_TEXT_WARNING_MESSAGE)
        : LEGACY_TRANSLATED_TEXT_WARNING_MESSAGE,
    []
  );

  useEffect(() => {
    const loadInitialPromptPreset = async () => {
      try {
        setIsPromptPresetLoading(true);

        if (lastPromptPresetName && !lastTextPromptPresetName) {
          updateConfig({ lastTextPromptPresetName: lastPromptPresetName });
        }

        const savedPresetName =
          translationType === TranslationType.Image
            ? lastImagePromptPresetName || ''
            : lastTextPromptPresetName || lastPromptPresetName;
        const type =
          translationType === TranslationType.Image
            ? PromptPresetDto.type.IMAGE
            : PromptPresetDto.type.TEXT;

        const listResponse = await PromptPresetsService.promptPresetControllerGetPromptPresets({
          type,
        });

        if (listResponse?.success && listResponse.presets) {
          const hasLegacyTextPresetInList =
            translationType !== TranslationType.Image &&
            listResponse.presets.some((preset) => preset.containsLegacyTranslatedText);
          let foundPreset = listResponse.presets.find((p) => p.name === savedPresetName);

          if (!foundPreset && listResponse.presets.length > 0) {
            foundPreset = listResponse.presets[0];
            console.warn(
              `저장된 프롬프트 프리셋(${savedPresetName})을(를) 현재 번역 유형('${type}')에서 찾을 수 없어 첫 번째 프리셋(${foundPreset.name})을(를) 로드합니다.`
            );
          }

          if (foundPreset) {
            const detailResponse =
              await PromptPresetsService.promptPresetControllerGetPromptPresetDetail({
                id: foundPreset.id,
              });

            if (detailResponse?.success && detailResponse.preset) {
              setCurrentPromptPresetName(detailResponse.preset.name);
              setPromptPresetContent(detailResponse.preset.prompt);
              if (translationType === TranslationType.Image) {
                updateConfig({ lastImagePromptPresetName: detailResponse.preset.name });
              } else {
                updateConfig({ lastTextPromptPresetName: detailResponse.preset.name });
              }
              const hasLegacyInLoadedPreset =
                detailResponse.preset.type === PromptPresetDto.type.TEXT &&
                (detailResponse.preset.containsLegacyTranslatedText ||
                  containsLegacyTranslatedTextKey(detailResponse.preset.prompt));

              if (hasLegacyInLoadedPreset) {
                showSnackbar(getLegacyWarningMessage(detailResponse.message));
              } else {
                showSnackbar(t('promptPresetLoader.loaded', { name: detailResponse.preset.name }));
                if (hasLegacyTextPresetInList) {
                  showSnackbar(getLegacyWarningMessage(listResponse.message));
                }
              }
            } else {
              console.warn(`초기 프롬프트 프리셋 상세 정보 로드 실패:`, detailResponse?.message);
              if (hasLegacyTextPresetInList) {
                showSnackbar(getLegacyWarningMessage(listResponse.message));
              }
              setCurrentPromptPresetName('');
              setPromptPresetContent(undefined);
            }
          } else {
            console.warn(`'${type}' 유형에 대한 프롬프트 프리셋을 찾을 수 없습니다.`);
            if (hasLegacyTextPresetInList) {
              showSnackbar(getLegacyWarningMessage(listResponse.message));
            }
            setCurrentPromptPresetName('');
            setPromptPresetContent(undefined);
          }
        } else {
          showSnackbar(listResponse?.message || t('promptPresetLoader.loadFailed'));
          setCurrentPromptPresetName('');
          setPromptPresetContent(undefined);
        }
      } catch (error) {
        console.error('초기 프롬프트 프리셋 로드 중 오류 발생:', error);
        const errorMessage = error instanceof Error ? error.message : t('errors.unknown');
        showSnackbar(t('promptPresetLoader.loadError', { message: errorMessage }));
        setCurrentPromptPresetName('');
        setPromptPresetContent(undefined);
      } finally {
        setIsPromptPresetLoading(false);
      }
    };

    if (!currentPromptPresetName) {
      void loadInitialPromptPreset();
    }
  }, [
    updateConfig,
    currentPromptPresetName,
    showSnackbar,
    lastPromptPresetName,
    lastTextPromptPresetName,
    lastImagePromptPresetName,
    translationType,
    t,
    getLegacyWarningMessage,
  ]);

  const handlePromptPresetChange = useCallback(
    (presetName: string, presetContent: string | undefined) => {
      setCurrentPromptPresetName(presetName);
      setPromptPresetContent(presetContent);
      // 텍스트 번역에서만 lastTextPromptPresetName에 저장
      if (translationType === TranslationType.Image) {
        updateConfig({ lastImagePromptPresetName: presetName });
      } else {
        updateConfig({ lastTextPromptPresetName: presetName });
      }
    },
    [translationType, updateConfig]
  );

  const resetPromptPreset = useCallback(() => {
    setCurrentPromptPresetName('');
    setPromptPresetContent(undefined);
  }, []);

  return {
    currentPromptPresetName,
    promptPresetContent,
    isPromptPresetLoading,
    setIsPromptPresetLoading,
    handlePromptPresetChange,
    resetPromptPreset,
  } as const;
};
