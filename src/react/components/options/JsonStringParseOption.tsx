import React, { useMemo } from 'react';
import { BaseParseOptions, BaseParseOptionsProps } from './BaseParseOptions';
import { JsonParserOptionsDto } from '@/nest/parser/dto/options/json-parser-options.dto';
import { TranslationType } from '../../contexts/TranslationContext';
import { OptionItem } from './DynamicOptions';

interface JsonStringParseOptionProps extends BaseParseOptionsProps<JsonParserOptionsDto> {}

const JsonStringParseOption: React.FC<JsonStringParseOptionProps> = (props) => {
  // JSON 문자열 파서 설정 항목 정의 (향후 옵션이 추가될 경우 여기에 추가)
  const jsonStringOptionItems: OptionItem[] = useMemo(
    () => [
      // JSON 문자열 관련 옵션 항목이 추가되면 여기에 추가
      // 예: { name: 'preserveFormatting', type: OptionType.BOOLEAN, description: '형식 유지' },
    ],
    []
  );

  return (
    <BaseParseOptions
      {...props}
      translationType={TranslationType.JsonString}
      optionItems={jsonStringOptionItems}
    />
  );
};

export default JsonStringParseOption;
