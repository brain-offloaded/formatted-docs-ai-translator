import React from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import ExamplePresetSelectorMinimal from '@/react/components/translation/ExamplePresetSelectorMinimal';
import PromptPresetSelectorMinimal from '@/react/components/translation/PromptPresetSelectorMinimal';
import { TranslationType } from '@/react/contexts/TranslationContext';
import { PromptPresetDto } from '@/react/api/generated/models/PromptPresetDto';

type ExamplePresetState = {
  currentPresetName: string;
  isPresetLoading: boolean;
  setIsPresetLoading: (value: boolean) => void;
  onPresetChange: (event: SelectChangeEvent<string>) => void;
};

type PromptPresetState = {
  currentPresetName: string;
  isPresetLoading: boolean;
  setIsPresetLoading: (value: boolean) => void;
  onPresetChange: (presetName: string, presetContent: string | undefined) => void;
};

interface TranslationPresetsSectionProps {
  translationType: TranslationType;
  isTranslating: boolean;
  examplePreset: ExamplePresetState;
  promptPreset: PromptPresetState;
}

export const TranslationPresetsSection: React.FC<TranslationPresetsSectionProps> = ({
  translationType,
  isTranslating,
  examplePreset,
  promptPreset,
}) => (
  <>
    {translationType !== TranslationType.Image && (
      <ExamplePresetSelectorMinimal
        currentPresetName={examplePreset.currentPresetName}
        onPresetChange={examplePreset.onPresetChange}
        isTranslating={isTranslating}
        isPresetLoading={examplePreset.isPresetLoading}
        setIsPresetLoading={examplePreset.setIsPresetLoading}
      />
    )}

    {translationType !== TranslationType.Image && (
      <PromptPresetSelectorMinimal
        currentPresetName={promptPreset.currentPresetName}
        onPresetChange={promptPreset.onPresetChange}
        isTranslating={isTranslating}
        isPresetLoading={promptPreset.isPresetLoading}
        setIsPresetLoading={promptPreset.setIsPresetLoading}
        type={PromptPresetDto.type.TEXT}
      />
    )}
  </>
);
