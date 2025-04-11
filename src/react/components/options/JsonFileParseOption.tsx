import React from 'react';
import { BaseParseOptions } from './BaseParseOptions';
import { TranslationType } from '../../contexts/TranslationContext';
import { OptionComponentType } from '../../types/translation-types';

// OptionComponentType 사용
const JsonFileParseOption: OptionComponentType<TranslationType.JsonFile> = (props) => {
  return (
    <BaseParseOptions
      {...props}
      translationType={TranslationType.JsonFile}
      label="JSON 파일 파싱 옵션"
    />
  );
};

export default JsonFileParseOption;
