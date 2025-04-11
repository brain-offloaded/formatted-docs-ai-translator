import React from 'react';
import { BaseTranslator, BaseTranslatorOptions } from './BaseTranslator';
import { TranslationType } from '../../contexts/TranslationContext';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { PlainTextParserOptionsDto } from '@/nest/parser/dto/options/plain-text-parser-options.dto';
import { BaseParseOptionsProps } from '../../components/options/BaseParseOptions';

const TextTranslator: React.FC<{
  OptionComponent: React.ComponentType<BaseParseOptionsProps<PlainTextParserOptionsDto>>;
}> = ({ OptionComponent }) => {
  // 번역기 옵션 설정
  const textTranslatorOptions: BaseTranslatorOptions = {
    inputLabel: '텍스트 입력:',
    inputPlaceholder: '번역할 텍스트를 입력하세요.',
    resultFileType: 'text/plain',

    // 번역 타입
    translationType: TranslationType.Text,

    // 입력 필드 행 수 (선택)
    inputFieldRows: 10,
  };

  // 출력 포맷 함수
  const formatOutput = (output: string): string => {
    return output;
  };

  return (
    <BaseTranslator<PlainTextParserOptionsDto>
      options={textTranslatorOptions}
      parseChannel={IpcChannel.ParsePlainText}
      applyChannel={IpcChannel.ApplyTranslationToPlainText}
      formatOutput={formatOutput}
      OptionComponent={OptionComponent}
    />
  );
};

export default TextTranslator;
