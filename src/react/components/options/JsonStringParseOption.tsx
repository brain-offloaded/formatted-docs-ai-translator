import React from 'react';
import BaseParseOptions, { BaseParseOptionsProps } from './BaseParseOptions';

interface JsonStringParseOptionProps extends BaseParseOptionsProps {}

const JsonStringParseOption: React.FC<JsonStringParseOptionProps> = (props) => {
  // JsonParserOptions는 sourceLanguage 외에 옵션이 없으므로 기본 옵션만 사용
  return <BaseParseOptions {...props} />;
};

export default JsonStringParseOption;
