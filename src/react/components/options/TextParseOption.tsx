import React from 'react';
import { Box } from '@mui/material';
import { BaseParseOptions, BaseParseOptionsProps } from './BaseParseOptions';
import { PlainTextParserOptionsDto } from '@/nest/parser/dto/options/plain-text-parser-options.dto';
import { TranslationType } from '../../contexts/TranslationContext';

interface TextParseOptionProps extends BaseParseOptionsProps<PlainTextParserOptionsDto> {}

const TextParseOption: React.FC<TextParseOptionProps> = (props) => {
  // 텍스트 번역에는 특별한 파싱 옵션이 없으므로 기본 옵션만 사용
  return (
    <Box sx={{ mb: 2 }}>
      <BaseParseOptions {...props} translationType={TranslationType.Text} />
    </Box>
  );
};

export default TextParseOption;
