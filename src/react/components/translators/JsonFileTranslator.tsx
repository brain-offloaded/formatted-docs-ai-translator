import React from 'react';
import { BaseTranslator, BaseTranslatorOptions } from './BaseTranslator';
import { TranslationType } from '../../contexts/TranslationContext';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { JsonParserOptionsDto } from '@/nest/parser/dto/options/json-parser-options.dto';

// Props 타입 정의
interface JsonFileTranslatorProps {
  parserOptions?: JsonParserOptionsDto | null;
  onOptionsChange?: (options: JsonParserOptionsDto) => void;
}

const JsonFileTranslator: React.FC<JsonFileTranslatorProps> = ({
  parserOptions,
  onOptionsChange,
}) => {
  // 번역기 옵션 설정
  const jsonFileTranslatorOptions: BaseTranslatorOptions = {
    inputLabel: 'JSON 파일 선택:',
    inputPlaceholder: '',
    resultFileType: 'application/json',

    // 번역 타입
    translationType: TranslationType.JsonFile,

    // 파일 업로더 설정
    fileExtension: '.json',
    fileLabel: 'JSON 파일',
  };

  // 출력 포맷 함수
  const formatOutput = (output: string): string => {
    return output;
  };

  return (
    <BaseTranslator<JsonParserOptionsDto>
      options={jsonFileTranslatorOptions}
      parseChannel={IpcChannel.ParseJsonFile}
      applyChannel={IpcChannel.ApplyTranslationToJsonFile}
      formatOutput={formatOutput}
      parserOptions={parserOptions}
      onOptionsChange={onOptionsChange}
    />
  );
};

export default JsonFileTranslator;
