import React from 'react';
import { BaseTranslator, BaseTranslatorOptions } from './BaseTranslator';
import { TranslationType } from '../../contexts/TranslationContext';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { getParserOptionComponent } from '../../constants/TranslationTypeMapping';

// JSON 파일 번역기
const JsonFileTranslator: React.FC = () => {
  // 번역기 옵션 설정
  const jsonFileTranslatorOptions: BaseTranslatorOptions = {
    inputLabel: 'JSON 파일 입력:',
    inputPlaceholder: '번역할 JSON 파일을 업로드하세요.',
    resultFileType: 'application/zip',

    // 번역 타입
    translationType: TranslationType.JsonFile,

    // 파일 업로더 설정
    fileExtension: '.json',
    fileLabel: 'JSON 파일',
  };

  // 출력 포맷 함수
  const formatOutput = (_output: string, isFileInput: boolean): string => {
    if (isFileInput) {
      return 'JSON 파일 번역이 완료되었습니다. 다운로드 버튼을 클릭하여 결과를 받으세요.';
    }
    return '';
  };

  // 파서 옵션 컴포넌트 가져오기
  const OptionComponent = getParserOptionComponent(TranslationType.JsonFile);

  return (
    <BaseTranslator
      options={jsonFileTranslatorOptions}
      parseChannel={IpcChannel.ParseJsonFile}
      applyChannel={IpcChannel.ApplyTranslationToJson}
      formatOutput={formatOutput}
      OptionComponent={OptionComponent}
    />
  );
};

export default JsonFileTranslator;
