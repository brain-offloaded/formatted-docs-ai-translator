import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ExamplePresetDto } from '../../nest/translation/example/dto/example-preset.dto';
import { PromptPresetDto } from '../../nest/translation/prompt/dto/prompt-preset.dto';
import { PromptPresetDetailDto } from '../../nest/translation/prompt/dto/prompt-preset-detail.dto';
import { IpcChannel } from '../../nest/common/ipc.channel';
import { useSettings } from './SettingsContext';

interface PresetContextType {
  examplePresets: ExamplePresetDto[];
  promptPresets: PromptPresetDto[];
  currentExamplePreset: ExamplePresetDto | null;
  currentPromptPreset: PromptPresetDetailDto | null;
  loadExamplePreset: (name: string) => Promise<void>;
  loadPromptPreset: (id: number) => Promise<void>;
  fetchPresets: () => Promise<void>;
  isPresetLoading: boolean;
}

const PresetContext = createContext<PresetContextType | undefined>(undefined);

export const PresetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { updateConfig } = useSettings();
  const [examplePresets, setExamplePresets] = useState<ExamplePresetDto[]>([]);
  const [promptPresets, setPromptPresets] = useState<PromptPresetDto[]>([]);
  const [currentExamplePreset, setCurrentExamplePreset] = useState<ExamplePresetDto | null>(null);
  const [currentPromptPreset, setCurrentPromptPreset] = useState<PromptPresetDetailDto | null>(
    null
  );
  const [isPresetLoading, setIsPresetLoading] = useState(false);

  const fetchPresets = useCallback(async () => {
    setIsPresetLoading(true);
    try {
      const [exampleResult, promptResult] = await Promise.all([
        window.electron.ipcRenderer.invoke(IpcChannel.GetExamplePresets),
        window.electron.ipcRenderer.invoke(IpcChannel.GetPromptPresets),
      ]);

      if (exampleResult.success) {
        setExamplePresets(exampleResult.presets);
      }
      if (promptResult.success) {
        setPromptPresets(promptResult.presets);
      }
    } catch (error) {
      console.error('프리셋 목록 로딩 실패:', error);
    } finally {
      setIsPresetLoading(false);
    }
  }, []);

  const loadExamplePreset = useCallback(
    async (name: string) => {
      setIsPresetLoading(true);
      try {
        const result = await window.electron.ipcRenderer.invoke(IpcChannel.LoadExamplePreset, {
          name,
        });
        if (result.success) {
          const preset = examplePresets.find((p) => p.name === name);
          setCurrentExamplePreset(preset || null);
          updateConfig({ lastPresetName: name });
        }
      } catch (error) {
        console.error(`예제 프리셋 로딩 실패: ${name}`, error);
      } finally {
        setIsPresetLoading(false);
      }
    },
    [examplePresets, updateConfig]
  );

  const loadPromptPreset = useCallback(
    async (id: number) => {
      setIsPresetLoading(true);
      try {
        const result = await window.electron.ipcRenderer.invoke(IpcChannel.GetPromptPresetDetail, {
          id,
        });
        if (result.success && result.preset) {
          setCurrentPromptPreset(result.preset);
          updateConfig({ lastPromptPresetName: result.preset.name });
        }
      } catch (error) {
        console.error(`프롬프트 프리셋 로딩 실패: ${id}`, error);
      } finally {
        setIsPresetLoading(false);
      }
    },
    [updateConfig]
  );

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const value = useMemo(
    () => ({
      examplePresets,
      promptPresets,
      currentExamplePreset,
      currentPromptPreset,
      loadExamplePreset,
      loadPromptPreset,
      fetchPresets,
      isPresetLoading,
    }),
    [
      examplePresets,
      promptPresets,
      currentExamplePreset,
      currentPromptPreset,
      loadExamplePreset,
      loadPromptPreset,
      fetchPresets,
      isPresetLoading,
    ]
  );

  return <PresetContext.Provider value={value}>{children}</PresetContext.Provider>;
};

export const usePresets = (): PresetContextType => {
  const context = useContext(PresetContext);
  if (context === undefined) {
    throw new Error('usePresets must be used within a PresetProvider');
  }
  return context;
};
