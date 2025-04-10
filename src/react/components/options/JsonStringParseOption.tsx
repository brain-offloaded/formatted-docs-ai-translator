import React from 'react';
import { Box } from '@mui/material';
import { BaseParseOptions, BaseParseOptionsProps } from './BaseParseOptions';
import { JsonParserOptionsDto } from '@/nest/parser/dto/options/json-parser-options.dto';
import { TranslationType } from '../../contexts/TranslationContext';

interface JsonStringParseOptionProps extends BaseParseOptionsProps<JsonParserOptionsDto> {}

const JsonStringParseOption: React.FC<JsonStringParseOptionProps> = (props) => {
  // JsonParserOptions는 sourceLanguage 외에 옵션이 없으므로 기본 옵션만 사용
  return (
    <Box sx={{ mb: 2 }}>
      <BaseParseOptions {...props} translationType={TranslationType.JsonString} />
    </Box>
  );
};

export default JsonStringParseOption;
