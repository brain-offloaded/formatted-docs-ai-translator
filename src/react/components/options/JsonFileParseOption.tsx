import React from 'react';
import { Box } from '@mui/material';
import { BaseParseOptions, BaseParseOptionsProps } from './BaseParseOptions';
import { JsonParserOptionsDto } from '@/nest/parser/dto/options/json-parser-options.dto';
import { TranslationType } from '../../contexts/TranslationContext';

interface JsonFileParseOptionProps extends BaseParseOptionsProps<JsonParserOptionsDto> {}

const JsonFileParseOption: React.FC<JsonFileParseOptionProps> = (props) => {
  // JsonParserOptions는 sourceLanguage 외에 옵션이 없으므로 기본 옵션만 사용
  return (
    <Box sx={{ mb: 2 }}>
      <BaseParseOptions {...props} translationType={TranslationType.JsonFile} />
    </Box>
  );
};

export default JsonFileParseOption;
