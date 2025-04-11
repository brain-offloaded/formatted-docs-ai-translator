import React from 'react';
import { BaseTranslator, BaseTranslatorOptions } from './BaseTranslator';
import { TranslationType } from '../../contexts/TranslationContext';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { JsonParserOptionsDto } from '@/nest/parser/dto/options/json-parser-options.dto';
import { BaseParseOptionsProps } from '../../components/options/BaseParseOptions';

const JsonStringTranslator: React.FC<{
  OptionComponent: React.ComponentType<BaseParseOptionsProps<JsonParserOptionsDto>>;
}> = ({ OptionComponent }) => {
  // 번역기 옵션 설정
  const jsonStringTranslatorOptions: BaseTranslatorOptions = {
    inputLabel: 'JSON 문자열 입력:',
    inputPlaceholder: '번역할 JSON 문자열을 입력하세요.',
    resultFileType: 'application/json',

    // 번역 타입
    translationType: TranslationType.JsonString,

    // 입력 필드 행 수 (선택)
    inputFieldRows: 12,
  };

  // 출력 포맷 함수
  const formatOutput = (output: string): string => {
    return output;
  };

  return (
    <BaseTranslator<JsonParserOptionsDto>
      options={jsonStringTranslatorOptions}
      parseChannel={IpcChannel.ParseJsonString}
      applyChannel={IpcChannel.ApplyTranslationToJsonString}
      formatOutput={formatOutput}
      OptionComponent={OptionComponent}
    />
  );
};

export default JsonStringTranslator;
