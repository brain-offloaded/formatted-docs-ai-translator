import React from 'react';
import {
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel as MuiFormControlLabel,
} from '@mui/material';
import { TranslationType } from '../../contexts/TranslationContext';
import { getTranslationTypes } from '../../constants/TranslationTypeMapping';

interface TranslationTypeSelectorProps {
  selectedType: TranslationType;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  availableTypes?: TranslationType[];
}

const TranslationTypeSelector: React.FC<TranslationTypeSelectorProps> = ({
  selectedType,
  onChange,
}) => {
  // 사용 가능한 번역 유형 가져오기
  const translationTypes = getTranslationTypes();
  const filteredTypes =
    availableTypes && availableTypes.length > 0
      ? translationTypes.filter((type) => availableTypes.includes(type.value))
      : translationTypes;

  return (
    <FormControl component="fieldset">
      <RadioGroup row value={selectedType} onChange={onChange} aria-label="translation-type">
        {filteredTypes.map((type) => (
          <MuiFormControlLabel
            key={type.value}
            value={type.value}
            control={<Radio />}
            label={type.label}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
};

export default TranslationTypeSelector;
