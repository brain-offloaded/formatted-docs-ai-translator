import React, { useMemo } from 'react';
import { BaseParseOptions, BaseParseOptionsProps } from './BaseParseOptions';
import { PlainTextParserOptionsDto } from '@/nest/parser/dto/options/plain-text-parser-options.dto';
import { TranslationType } from '../../contexts/TranslationContext';
import { OptionItem } from './DynamicOptions';

interface TextParseOptionProps extends BaseParseOptionsProps<PlainTextParserOptionsDto> {}

const TextParseOption: React.FC<TextParseOptionProps> = (props) => {
  // 텍스트 번역에는 특별한 파싱 옵션이 없으므로 빈 배열 전달
  const textOptionItems: OptionItem[] = useMemo(() => [], []);

  return (
    <BaseParseOptions
      {...props}
      translationType={TranslationType.Text}
      optionItems={textOptionItems}
    />
  );
};

export default TextParseOption;
