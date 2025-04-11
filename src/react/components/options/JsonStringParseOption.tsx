import React from 'react';
import { BaseParseOptions } from './BaseParseOptions';
import { TranslationType } from '../../contexts/TranslationContext';
import { OptionComponentType } from '../../types/translation-types';

// OptionComponentType 사용
const JsonStringParseOption: OptionComponentType<TranslationType.JsonString> = (props) => {
  return (
    <BaseParseOptions
      {...props}
      translationType={TranslationType.JsonString}
      label="JSON 문자열 파싱 옵션"
    />
  );
};

export default JsonStringParseOption;
