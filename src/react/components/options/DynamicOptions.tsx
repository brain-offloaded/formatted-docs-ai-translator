import React from 'react';
import {
  Box,
  Switch,
  FormControlLabel,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';

// 설정 항목 타입 정의
export enum OptionType {
  SHORT_STRING = 'short_string',
  LONG_STRING = 'long_string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  ENUM = 'enum',
}

// 설정 항목 인터페이스
export interface OptionItem {
  key: string; // 내부적으로 사용할 키 (영어)
  label: string; // UI에 표시될 이름
  type: OptionType;
  description: string;
  enumOptions?: Array<{ value: string; label: string }>; // ENUM 타입에 사용될 옵션 목록
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

// 각 옵션 타입별 렌더링 컴포넌트
interface OptionItemProps {
  option: OptionItem;
  value: string | number | boolean;
  onChange: (key: string, value: string | number | boolean) => void;
  disabled: boolean;
}

// 짧은 문자열 입력 옵션
const ShortStringOption: React.FC<OptionItemProps> = ({ option, value, onChange, disabled }) => (
  <TextField
    key={option.key}
    label={option.label}
    value={value as string}
    onChange={(e) => onChange(option.key, e.target.value)}
    disabled={disabled}
    size="small"
    helperText={option.description}
  />
);

// 긴 문자열 입력 옵션
const LongStringOption: React.FC<OptionItemProps> = ({ option, value, onChange, disabled }) => (
  <TextField
    key={option.key}
    label={option.label}
    value={value as string}
    onChange={(e) => onChange(option.key, e.target.value)}
    disabled={disabled}
    multiline
    rows={4}
    fullWidth
    helperText={option.description}
  />
);

// 숫자 입력 옵션
const NumberOption: React.FC<OptionItemProps> = ({ option, value, onChange, disabled }) => (
  <TextField
    key={option.key}
    label={option.label}
    type="number"
    value={value as number}
    onChange={(e) => onChange(option.key, Number(e.target.value))}
    disabled={disabled}
    size="small"
    helperText={option.description}
  />
);

// 불리언 입력 옵션
const BooleanOption: React.FC<OptionItemProps> = ({ option, value, onChange, disabled }) => (
  <FormControlLabel
    key={option.key}
    control={
      <Switch
        checked={value as boolean}
        onChange={(e) => onChange(option.key, e.target.checked)}
        disabled={disabled}
      />
    }
    label={
      <>
        {option.label}
        <Typography variant="caption" display="block" color="text.secondary">
          {option.description}
        </Typography>
      </>
    }
  />
);

// 열거형 선택 옵션
const EnumOption: React.FC<OptionItemProps> = ({ option, value, onChange, disabled }) => (
  <FormControl key={option.key} fullWidth size="small">
    <InputLabel id={`${option.key}-label`}>{option.label}</InputLabel>
    <Select
      labelId={`${option.key}-label`}
      value={value as string}
      onChange={(e) => onChange(option.key, e.target.value)}
      disabled={disabled}
      label={option.label}
    >
      {option.enumOptions?.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </Select>
    <FormHelperText>{option.description}</FormHelperText>
  </FormControl>
);

// 옵션 타입에 따라 적절한 컴포넌트 반환
const getOptionComponent = (props: OptionItemProps) => {
  const { option } = props;

  switch (option.type) {
    case OptionType.SHORT_STRING:
      return <ShortStringOption {...props} />;
    case OptionType.LONG_STRING:
      return <LongStringOption {...props} />;
    case OptionType.NUMBER:
      return <NumberOption {...props} />;
    case OptionType.BOOLEAN:
      return <BooleanOption {...props} />;
    case OptionType.ENUM:
      return <EnumOption {...props} />;
    default:
      return null;
  }
};

// 옵션 타입에 따른 기본값 반환
const getDefaultValue = (option: OptionItem) => {
  switch (option.type) {
    case OptionType.BOOLEAN:
      return false;
    case OptionType.NUMBER:
      return 0;
    case OptionType.ENUM:
      return option.enumOptions?.[0]?.value || '';
    default:
      return '';
  }
};

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
        const value = values[option.key] ?? getDefaultValue(option);

        return (
          <Box key={option.key}>
            {getOptionComponent({
              option,
              value,
              onChange: handleValueChange,
              disabled,
            })}
          </Box>
        );
      })}
    </Box>
  );
};

export default DynamicOptions;
