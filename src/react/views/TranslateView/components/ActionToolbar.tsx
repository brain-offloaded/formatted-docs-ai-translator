import React from 'react';
import { Box } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import ExamplePresetSelectorMinimal from '../../../components/translation/ExamplePresetSelectorMinimal';
import PromptPresetSelectorMinimal from '../../../components/translation/PromptPresetSelectorMinimal';
import TranslationTypeSelector from '../../../components/common/TranslationTypeSelector';
import { TranslationType } from '../../../contexts/TranslationContext';
import { usePresets } from '../../../contexts/PresetContext';

interface ActionToolbarProps {
  translationType: TranslationType;
  handleTranslationTypeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isTranslating: boolean;
}

const ActionToolbar: React.FC<ActionToolbarProps> = ({
  translationType,
  handleTranslationTypeChange,
  isTranslating,
}) => {
  const {
    currentExamplePreset,
    loadExamplePreset,
    currentPromptPreset,
    loadPromptPreset,
    isPresetLoading,
    promptPresets,
  } = usePresets();

  const handleExamplePresetChange = React.useCallback(
    async (event: SelectChangeEvent<string>) => {
      const newPresetName = event.target.value;
      if (newPresetName === currentExamplePreset?.name) return;
      await loadExamplePreset(newPresetName);
    },
    [loadExamplePreset, currentExamplePreset]
  );

  const handlePromptPresetChange = React.useCallback(
    (presetName: string) => {
      const preset = promptPresets.find((p) => p.name === presetName);
      if (preset) {
        loadPromptPreset(preset.id);
      }
    },
    [loadPromptPreset, promptPresets]
  );

  return (
    <Box sx={{ mb: 2 }}>
      <ExamplePresetSelectorMinimal
        currentPresetName={currentExamplePreset?.name || ''}
        onPresetChange={handleExamplePresetChange}
        isTranslating={isTranslating}
        isPresetLoading={isPresetLoading}
      />
      <PromptPresetSelectorMinimal
        currentPresetName={currentPromptPreset?.name || ''}
        onPresetChange={handlePromptPresetChange}
        isTranslating={isTranslating}
        isPresetLoading={isPresetLoading}
      />
      <TranslationTypeSelector
        selectedType={translationType}
        onChange={handleTranslationTypeChange}
      />
    </Box>
  );
};

export default ActionToolbar;
