import React from 'react';
import { Box, Switch, FormControlLabel, TextField, Typography } from '@mui/material';

// 설정 항목 타입 정의
export enum OptionType {
  SHORT_STRING = 'short_string',
  LONG_STRING = 'long_string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
}

// 설정 항목 인터페이스
export interface OptionItem {
  key: string; // 내부적으로 사용할 키 (영어)
  label: string; // UI에 표시될 이름
  type: OptionType;
  description: string;
}

// 설정 값 타입
export type OptionsValues = {
  [key: string]: string | number | boolean;
};

interface DynamicOptionsProps {
  options: OptionItem[];
  values: OptionsValues;
  onChange: (values: OptionsValues) => void;
  disabled?: boolean;
}

export const DynamicOptions: React.FC<DynamicOptionsProps> = ({
  options,
  values,
  onChange,
  disabled = false,
}) => {
  // 값 변경 핸들러
  const handleValueChange = (key: string, value: string | number | boolean) => {
    onChange({
      ...values,
      [key]: value,
    });
  };

  // 설정 항목이 없는 경우
  if (options.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>가능한 설정이 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
      {options.map((option) => {
        const { key, label, type, description } = option;
        const value =
          values[key] ??
          (type === OptionType.BOOLEAN ? false : type === OptionType.NUMBER ? 0 : '');

        switch (type) {
          case OptionType.SHORT_STRING:
            return (
              <TextField
                key={key}
                label={label}
                value={value as string}
                onChange={(e) => handleValueChange(key, e.target.value)}
                disabled={disabled}
                size="small"
                helperText={description}
              />
            );
          case OptionType.LONG_STRING:
            return (
              <TextField
                key={key}
                label={label}
                value={value as string}
                onChange={(e) => handleValueChange(key, e.target.value)}
                disabled={disabled}
                multiline
                rows={4}
                fullWidth
                helperText={description}
              />
            );
          case OptionType.NUMBER:
            return (
              <TextField
                key={key}
                label={label}
                type="number"
                value={value as number}
                onChange={(e) => handleValueChange(key, Number(e.target.value))}
                disabled={disabled}
                size="small"
                helperText={description}
              />
            );
          case OptionType.BOOLEAN:
            return (
              <FormControlLabel
                key={key}
                control={
                  <Switch
                    checked={value as boolean}
                    onChange={(e) => handleValueChange(key, e.target.checked)}
                    disabled={disabled}
                  />
                }
                label={
                  <>
                    {label}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {description}
                    </Typography>
                  </>
                }
              />
            );
          default:
            return null;
        }
      })}
    </Box>
  );
};

export default DynamicOptions;
