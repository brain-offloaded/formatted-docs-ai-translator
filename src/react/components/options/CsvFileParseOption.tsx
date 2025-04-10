import React, { useState, useEffect, useCallback } from 'react';
import { Box, Switch, FormControlLabel, TextField } from '@mui/material';
import { BaseParseOptions, BaseParseOptionsProps } from './BaseParseOptions';
import { CsvParserOptionsDto } from '@/nest/parser/dto/options/csv-parser-options.dto';

interface CsvFileParseOptionProps extends BaseParseOptionsProps<CsvParserOptionsDto> {}

const CsvFileParseOption: React.FC<CsvFileParseOptionProps> = (props) => {
  const { isTranslating, onOptionsChange, initialOptions } = props;
  const defaultDelimiter = initialOptions?.delimiter || ',';
  const defaultReplaceDelimiter = initialOptions?.replaceDelimiter || ';';
  const defaultSkipFirstLine = initialOptions?.skipFirstLine || false;

  const [delimiter, setDelimiter] = useState(defaultDelimiter);
  const [replaceDelimiter, setReplaceDelimiter] = useState(defaultReplaceDelimiter);
  const [skipFirstLine, setSkipFirstLine] = useState(defaultSkipFirstLine);

  // 내부 옵션 변경 핸들러
  const handleInternalOptionsChange = useCallback(
    (options: Partial<CsvParserOptionsDto>) => {
      if (onOptionsChange && initialOptions) {
        // 기존 옵션과 새 옵션 병합
        onOptionsChange({
          ...initialOptions,
          ...options,
        });
      }
    },
    [onOptionsChange, initialOptions]
  );

  // 옵션 변경 핸들러
  const handleDelimiterChange = useCallback(
    (value: string) => {
      setDelimiter(value);
      handleInternalOptionsChange({ delimiter: value });
    },
    [handleInternalOptionsChange]
  );

  const handleReplaceDelimiterChange = useCallback(
    (value: string) => {
      setReplaceDelimiter(value);
      handleInternalOptionsChange({ replaceDelimiter: value });
    },
    [handleInternalOptionsChange]
  );

  const handleSkipFirstLineChange = useCallback(
    (value: boolean) => {
      setSkipFirstLine(value);
      handleInternalOptionsChange({ skipFirstLine: value });
    },
    [handleInternalOptionsChange]
  );

  // 초기 옵션 변경 감지
  useEffect(() => {
    if (initialOptions) {
      if (initialOptions.delimiter !== undefined && initialOptions.delimiter !== delimiter) {
        setDelimiter(initialOptions.delimiter);
      }

      if (
        initialOptions.replaceDelimiter !== undefined &&
        initialOptions.replaceDelimiter !== replaceDelimiter
      ) {
        setReplaceDelimiter(initialOptions.replaceDelimiter);
      }

      if (
        initialOptions.skipFirstLine !== undefined &&
        initialOptions.skipFirstLine !== skipFirstLine
      ) {
        setSkipFirstLine(initialOptions.skipFirstLine);
      }
    }
  }, [initialOptions, delimiter, replaceDelimiter, skipFirstLine]);

  return (
    <Box sx={{ mb: 2 }}>
      <BaseParseOptions {...props} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
        <TextField
          label="구분자"
          value={delimiter}
          onChange={(e) => handleDelimiterChange(e.target.value)}
          disabled={isTranslating}
          size="small"
          helperText="CSV 파일의 열을 구분하는 문자"
        />

        <TextField
          label="대체 구분자"
          value={replaceDelimiter}
          onChange={(e) => handleReplaceDelimiterChange(e.target.value)}
          disabled={isTranslating}
          size="small"
          helperText="번역된 텍스트 내 구분자를 대체할 문자"
        />

        <FormControlLabel
          control={
            <Switch
              checked={skipFirstLine}
              onChange={(e) => handleSkipFirstLineChange(e.target.checked)}
              disabled={isTranslating}
            />
          }
          label="첫 번째 줄 건너뛰기 (헤더 행)"
        />
      </Box>
    </Box>
  );
};

export default CsvFileParseOption;
