import React from 'react';
import { Box } from '@mui/material';
import { getTranslatorWithOptions } from '../../../constants/TranslationTypeMapping';
import { BaseParseOptionsDto } from '../../../../nest/parser/dto/options/base-parse-options.dto';
import { TranslationType } from '../../../contexts/TranslationContext';
import { usePresets } from '../../../contexts/PresetContext';

interface InputPanelProps {
  translationType: TranslationType;
  isTranslating: boolean;
  parserOptions: BaseParseOptionsDto | null;
  handleOptionsChange: (options: BaseParseOptionsDto) => void;
  showSettings: boolean;
  toggleSettings: () => void;
  translationTypeLabel: string;
}

const InputPanel: React.FC<InputPanelProps> = ({
  translationType,
  isTranslating,
  parserOptions,
  handleOptionsChange,
  showSettings,
  toggleSettings,
  translationTypeLabel,
}) => {
  const { currentPromptPreset } = usePresets();

  const {
    TranslatorComponent,
    OptionComponent,
    options: translatorOptions,
  } = React.useMemo(() => getTranslatorWithOptions(translationType), [translationType]);

  return (
    <Box sx={{ mb: 2 }}>
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

      <TranslatorComponent
        key={translationType}
        options={translatorOptions}
        parserOptions={parserOptions}
        promptPresetContent={currentPromptPreset?.prompt}
      />
    </Box>
  );
};

export default InputPanel;
