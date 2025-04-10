import React, { useState, useEffect, useCallback } from 'react';
import { Box, Switch, FormControlLabel, TextField } from '@mui/material';
import { BaseParseOptions, BaseParseOptionsProps } from './BaseParseOptions';
import { CsvParserOptionsDto } from '@/nest/parser/dto/options/csv-parser-options.dto';
import { ConfigStore } from '../../config/config-store';

interface CsvFileParseOptionProps extends BaseParseOptionsProps {
  initialOptions?: CsvParserOptionsDto;
}

const CsvFileParseOption: React.FC<CsvFileParseOptionProps> = ({
  isTranslating,
  onOptionsChange,
  initialOptions,
}) => {
  const configStore = ConfigStore.getInstance();
  const [delimiter, setDelimiter] = useState(initialOptions?.delimiter || ',');
  const [replaceDelimiter, setReplaceDelimiter] = useState(initialOptions?.replaceDelimiter || ';');
  const [skipFirstLine, setSkipFirstLine] = useState(initialOptions?.skipFirstLine || false);

  // 초기 옵션이 변경될 때 상태 업데이트
  useEffect(() => {
    if (initialOptions) {
      if (initialOptions.delimiter) setDelimiter(initialOptions.delimiter);
      if (initialOptions.replaceDelimiter) setReplaceDelimiter(initialOptions.replaceDelimiter);
      if (initialOptions.skipFirstLine !== undefined)
        setSkipFirstLine(initialOptions.skipFirstLine);
    }
  }, [initialOptions]);

  // 옵션 변경 시 부모 컴포넌트에 알림
  const updateOptions = useCallback(() => {
    if (onOptionsChange) {
      const options: CsvParserOptionsDto = {
        sourceLanguage: configStore.getConfig().sourceLanguage,
        delimiter,
        replaceDelimiter,
        skipFirstLine,
      };
      console.log('CSV 옵션 업데이트:', options);
      onOptionsChange(options);
    }
  }, [configStore, delimiter, replaceDelimiter, skipFirstLine, onOptionsChange]);

  // 옵션 변경 시 업데이트
  useEffect(() => {
    updateOptions();
  }, [updateOptions]);

  return (
    <Box sx={{ mb: 2 }}>
      <BaseParseOptions isTranslating={isTranslating} onOptionsChange={updateOptions} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
        <TextField
          label="구분자"
          value={delimiter}
          onChange={(e) => setDelimiter(e.target.value)}
          disabled={isTranslating}
          size="small"
          helperText="CSV 파일의 열을 구분하는 문자"
        />

        <TextField
          label="대체 구분자"
          value={replaceDelimiter}
          onChange={(e) => setReplaceDelimiter(e.target.value)}
          disabled={isTranslating}
          size="small"
          helperText="번역된 텍스트 내 구분자를 대체할 문자"
        />

        <FormControlLabel
          control={
            <Switch
              checked={skipFirstLine}
              onChange={(e) => setSkipFirstLine(e.target.checked)}
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
