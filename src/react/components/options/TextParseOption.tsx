import React from 'react';
import { BaseParseOptions, BaseParseOptionsProps } from './BaseParseOptions';

interface TextParseOptionProps extends BaseParseOptionsProps {}

const TextParseOption: React.FC<TextParseOptionProps> = (props) => {
  // 텍스트 번역에는 특별한 파싱 옵션이 없으므로 기본 옵션만 사용
  return <BaseParseOptions {...props} />;
};

export default TextParseOption;
