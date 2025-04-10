import React from 'react';
import { BaseTranslator, BaseTranslatorOptions } from './BaseTranslator';
import { TranslationType } from '../../contexts/TranslationContext';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { getParserOptionComponent } from '../../constants/TranslationTypeMapping';

// CSV 파일 번역기
const CsvFileTranslator: React.FC = () => {
  // 번역기 옵션 설정
  const csvFileTranslatorOptions: BaseTranslatorOptions = {
    inputLabel: 'CSV 파일 입력:',
    inputPlaceholder: '번역할 CSV 파일을 업로드하세요.',
    resultFileType: 'text/csv',

    // 번역 타입
    translationType: TranslationType.CsvFile,

    // 파일 업로더 설정
    fileExtension: '.csv',
    fileLabel: 'CSV 파일',
  };

  // 출력 포맷 함수
  const formatOutput = (_output: string, isFileInput: boolean): string => {
    if (isFileInput) {
      return 'CSV 파일 번역이 완료되었습니다. 다운로드 버튼을 클릭하여 결과를 받으세요.';
    }
    return '';
  };

  // 파서 옵션 컴포넌트 가져오기
  const OptionComponent = getParserOptionComponent(TranslationType.CsvFile);

  return (
    <BaseTranslator
      options={csvFileTranslatorOptions}
      parseChannel={IpcChannel.ParseCsvFile}
      applyChannel={IpcChannel.ApplyTranslationToCsvFile}
      formatOutput={formatOutput}
      OptionComponent={OptionComponent}
    />
  );
};

export default CsvFileTranslator; 