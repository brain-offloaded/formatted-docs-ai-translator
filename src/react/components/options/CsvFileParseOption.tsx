import React from 'react';
import { Box, Switch, FormControlLabel, TextField } from '@mui/material';
import { BaseParseOptions, BaseParseOptionsProps, useParseOptions } from './BaseParseOptions';
import { CsvParserOptionsDto } from '@/nest/parser/dto/options/csv-parser-options.dto';
import { TranslationType } from '../../contexts/TranslationContext';

interface CsvFileParseOptionProps extends BaseParseOptionsProps<CsvParserOptionsDto> {}

const CsvFileParseOption: React.FC<CsvFileParseOptionProps> = (props) => {
  const { isTranslating, onOptionsChange, initialOptions } = props;

  // useParseOptions 훅 사용
  const { options, createFieldChangeHandler } = useParseOptions<CsvParserOptionsDto>(
    initialOptions,
    TranslationType.CsvFile,
    onOptionsChange
  );

  // 각 필드에 대한 핸들러 생성
  const handleDelimiterChange = createFieldChangeHandler('delimiter');
  const handleReplaceDelimiterChange = createFieldChangeHandler('replaceDelimiter');
  const handleSkipFirstLineChange = createFieldChangeHandler('skipFirstLine');

  return (
    <Box sx={{ mb: 2 }}>
      <BaseParseOptions {...props} translationType={TranslationType.CsvFile} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
        <TextField
          label="구분자"
          value={options.delimiter}
          onChange={(e) => handleDelimiterChange(e.target.value)}
          disabled={isTranslating}
          size="small"
          helperText="CSV 파일의 열을 구분하는 문자"
        />

        <TextField
          label="대체 구분자"
          value={options.replaceDelimiter}
          onChange={(e) => handleReplaceDelimiterChange(e.target.value)}
          disabled={isTranslating}
          size="small"
          helperText="번역된 텍스트 내 구분자를 대체할 문자"
        />

        <FormControlLabel
          control={
            <Switch
              checked={options.skipFirstLine}
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
