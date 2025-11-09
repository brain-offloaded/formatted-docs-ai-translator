import { useCallback, useEffect, useState } from 'react';
import { ExamplePresetDto, ExamplePresetsService } from '@/react/api/generated';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useTranslation } from 'react-i18next';

interface Deps {
  lastPresetName: string | undefined;
  updateConfig: (partial: Record<string, unknown>) => void;
  showSnackbar: (msg: string) => void;
}

export const useExamplePresetLoader = ({ lastPresetName, updateConfig, showSnackbar }: Deps) => {
  const [currentExamplePresetName, setCurrentExamplePresetName] = useState<string>('');
  const [isExamplePresetLoading, setIsExamplePresetLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setIsExamplePresetLoading(true);
        const response = await ExamplePresetsService.examplePresetControllerGetExamplePresets();

        if (!response || !response.success || !response.presets?.length) {
          showSnackbar(response?.message || t('examplePresetLoader.initialLoadFailed'));
          return;
        }

        const presets: ExamplePresetDto[] = response.presets;
        const savedPresetName = lastPresetName ?? response.currentPreset ?? '';
        const presetExists = savedPresetName
          ? presets.some((preset) => preset.name === savedPresetName)
          : false;
        const targetPresetName = presetExists ? savedPresetName : (presets[0]?.name ?? '');

        setCurrentExamplePresetName(targetPresetName);

        if (targetPresetName !== response.currentPreset) {
          const loadResponse = await ExamplePresetsService.examplePresetControllerLoadExamplePreset(
            { requestBody: { name: targetPresetName } }
          );

          if (!loadResponse?.success) {
            console.warn(`초기 예제 프리셋(${targetPresetName}) 로드 실패:`, loadResponse?.message);
          } else {
            updateConfig({ lastPresetName: targetPresetName });
          }
        } else {
          updateConfig({ lastPresetName: targetPresetName });
        }
      } catch (error) {
        console.error('초기 예제 프리셋 로드 중 오류 발생:', error);
        const message = error instanceof Error ? error.message : t('errors.unknown');
        showSnackbar(t('examplePresetLoader.initialLoadError', { message }));
      } finally {
        setIsExamplePresetLoading(false);
      }
    };

    if (!currentExamplePresetName) {
      void loadInitial();
    }
  }, [currentExamplePresetName, lastPresetName, updateConfig, showSnackbar, t]);

  const handleExamplePresetChange = useCallback(
    async (event: SelectChangeEvent<string>) => {
      const newPresetName = event.target.value;
      if (newPresetName === currentExamplePresetName) return;

      try {
        setIsExamplePresetLoading(true);
        const response = await ExamplePresetsService.examplePresetControllerLoadExamplePreset({
          requestBody: { name: newPresetName },
        });

        if (!response?.success) {
          showSnackbar(response?.message || t('examplePresetLoader.loadFailed'));
          return;
        }

        setCurrentExamplePresetName(newPresetName);
        updateConfig({ lastPresetName: newPresetName });
        showSnackbar(t('examplePresetLoader.loaded', { name: newPresetName }));
      } catch (error) {
        console.error('예제 프리셋 로드 중 오류 발생:', error);
        const message = error instanceof Error ? error.message : t('errors.unknown');
        showSnackbar(t('examplePresetLoader.loadError', { message }));
      } finally {
        setIsExamplePresetLoading(false);
      }
    },
    [currentExamplePresetName, showSnackbar, updateConfig, t]
  );

  const resetExamplePreset = useCallback(() => {
    setCurrentExamplePresetName('');
  }, []);

  return {
    currentExamplePresetName,
    isExamplePresetLoading,
    setIsExamplePresetLoading,
    handleExamplePresetChange,
    resetExamplePreset,
  } as const;
};
