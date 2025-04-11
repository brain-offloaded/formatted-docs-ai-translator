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
  name: string;
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
  const handleValueChange = (name: string, value: string | number | boolean) => {
    onChange({
      ...values,
      [name]: value,
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
        const { name, type, description } = option;
        const value =
          values[name] ??
          (type === OptionType.BOOLEAN ? false : type === OptionType.NUMBER ? 0 : '');

        switch (type) {
          case OptionType.SHORT_STRING:
            return (
              <TextField
                key={name}
                label={name}
                value={value as string}
                onChange={(e) => handleValueChange(name, e.target.value)}
                disabled={disabled}
                size="small"
                helperText={description}
              />
            );
          case OptionType.LONG_STRING:
            return (
              <TextField
                key={name}
                label={name}
                value={value as string}
                onChange={(e) => handleValueChange(name, e.target.value)}
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
                key={name}
                label={name}
                type="number"
                value={value as number}
                onChange={(e) => handleValueChange(name, Number(e.target.value))}
                disabled={disabled}
                size="small"
                helperText={description}
              />
            );
          case OptionType.BOOLEAN:
            return (
              <FormControlLabel
                key={name}
                control={
                  <Switch
                    checked={value as boolean}
                    onChange={(e) => handleValueChange(name, e.target.checked)}
                    disabled={disabled}
                  />
                }
                label={
                  <>
                    {name}
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
