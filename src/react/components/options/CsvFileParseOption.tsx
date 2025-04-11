import React, { useMemo } from 'react';
import { BaseParseOptions } from './BaseParseOptions';
import { TranslationType } from '../../contexts/TranslationContext';
import { OptionItem, OptionType } from './DynamicOptions';
import { OptionComponentType } from '../../types/translation-types';

// OptionComponentType 사용
const CsvFileParseOption: OptionComponentType<TranslationType.CsvFile> = (props) => {
  // CSV 파서 설정 항목 정의
  const csvOptionItems: OptionItem[] = useMemo(
    () => [
      {
        name: 'delimiter',
        type: OptionType.SHORT_STRING,
        description: 'CSV 파일의 열을 구분하는 문자',
      },
      {
        name: 'replaceDelimiter',
        type: OptionType.SHORT_STRING,
        description: '번역된 텍스트 내 구분자를 대체할 문자',
      },
      {
        name: 'skipFirstLine',
        type: OptionType.BOOLEAN,
        description: '첫 번째 줄 건너뛰기 (헤더 행)',
      },
    ],
    []
  );

  return (
    <BaseParseOptions
      {...props}
      translationType={TranslationType.CsvFile}
      optionItems={csvOptionItems}
    />
  );
};

export default CsvFileParseOption;
