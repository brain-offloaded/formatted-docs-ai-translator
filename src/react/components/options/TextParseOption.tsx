import React from 'react';
import { BaseParseOptions } from './BaseParseOptions';
import { TranslationType } from '../../contexts/TranslationContext';
import { OptionComponentType } from '../../types/translation-types';

// OptionComponentType 사용
const TextParseOption: OptionComponentType<TranslationType.Text> = (props) => {
  return (
    <BaseParseOptions {...props} translationType={TranslationType.Text} label="텍스트 파싱 옵션" />
  );
};

export default TextParseOption;
