import React, { useMemo } from 'react';
import { BaseParseOptions, BaseParseOptionsProps } from './BaseParseOptions';
import { JsonParserOptionsDto } from '@/nest/parser/dto/options/json-parser-options.dto';
import { TranslationType } from '../../contexts/TranslationContext';
import { OptionItem } from './DynamicOptions';

interface JsonFileParseOptionProps extends BaseParseOptionsProps<JsonParserOptionsDto> {}

const JsonFileParseOption: React.FC<JsonFileParseOptionProps> = (props) => {
  // JSON 파서 설정 항목 정의 (향후 옵션이 추가될 경우 여기에 추가)
  const jsonOptionItems: OptionItem[] = useMemo(
    () => [
      // JSON 관련 옵션 항목이 추가되면 여기에 추가
      // 예: { name: 'indentation', type: OptionType.NUMBER, description: 'JSON 들여쓰기 크기' },
    ],
    []
  );

  return (
    <BaseParseOptions
      {...props}
      translationType={TranslationType.JsonFile}
      optionItems={jsonOptionItems}
    />
  );
};

export default JsonFileParseOption;
