import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { TranslationType, TranslationResultState } from '@/react/contexts/TranslationContext';
import { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';

interface UseTranslationViewControllerOptions {
  translationType: TranslationType;
  setTranslationType: (type: TranslationType) => void;
  handleClearFiles: () => void;
  setResultState: Dispatch<SetStateAction<TranslationResultState>>;
  resetPromptPreset: () => void;
  resetExamplePreset: () => void;
  resetSettingsVisibility: () => void;
}

export const useTranslationViewController = ({
  translationType,
  setTranslationType,
  handleClearFiles,
  setResultState,
  resetPromptPreset,
  resetExamplePreset,
  resetSettingsVisibility,
}: UseTranslationViewControllerOptions) => {
  const [parserOptions, setParserOptions] = useState<BaseParseOptionsDto | null>(null);

  const handleOptionsChange = useCallback((options: BaseParseOptionsDto) => {
    setParserOptions((prevOptions) => {
      if (JSON.stringify(prevOptions) === JSON.stringify(options)) {
        return prevOptions;
      }
      return options;
    });
  }, []);

  const handleTranslationTypeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newType = event.target.value as TranslationType;
      if (newType === translationType) return;

      setTranslationType(newType);
      handleClearFiles();
      setResultState((prev) => ({
        ...prev,
        translationResult: null,
        report: null,
        imageResult: null,
        zipBlob: null,
        singleFileBlob: null,
        singleFileName: null,
      }));
      setParserOptions(null);
      resetSettingsVisibility();
      resetPromptPreset();
      resetExamplePreset();
    },
    [
      translationType,
      setTranslationType,
      handleClearFiles,
      setResultState,
      resetSettingsVisibility,
      resetPromptPreset,
      resetExamplePreset,
    ]
  );

  return {
    parserOptions,
    handleOptionsChange,
    handleTranslationTypeChange,
  };
};
