import { useCallback, useEffect, useState } from 'react';
import { useConfigStore } from '@/react/config/config-store';

interface UseImagePromptSelectionOptions {
  initialPrompt?: string;
  onPresetChange?: (name: string, content: string | undefined) => void;
}

export const useImagePromptSelection = ({
  initialPrompt,
  onPresetChange,
}: UseImagePromptSelectionOptions) => {
  const { lastImagePromptPresetName, updateConfig, sourceLanguage } = useConfigStore();
  const [promptPresetContent, setPromptPresetContent] = useState<string | undefined>(initialPrompt);
  const [isPresetLoading, setIsPresetLoading] = useState(false);

  const handlePresetChange = useCallback(
    (name: string, content: string | undefined) => {
      updateConfig({ lastImagePromptPresetName: name });
      setPromptPresetContent(content);
      onPresetChange?.(name, content);
    },
    [onPresetChange, updateConfig]
  );

  useEffect(() => {
    if (initialPrompt !== undefined && initialPrompt !== promptPresetContent) {
      setPromptPresetContent(initialPrompt);
    }
  }, [initialPrompt, promptPresetContent]);

  return {
    promptPresetContent,
    setPromptPresetContent,
    isPresetLoading,
    setIsPresetLoading,
    handlePresetChange,
    lastImagePromptPresetName,
    sourceLanguage,
  };
};
