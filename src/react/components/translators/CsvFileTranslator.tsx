import React from 'react';
import { BaseTranslator, BaseTranslatorOptions } from './BaseTranslator';
import { TranslationType } from '../../contexts/TranslationContext';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { CsvParserOptionsDto } from '@/nest/parser/dto/options/csv-parser-options.dto';

// Props 타입 정의
interface CsvFileTranslatorProps {
  parserOptions?: CsvParserOptionsDto | null;
  onOptionsChange?: (options: CsvParserOptionsDto) => void;
}

const CsvFileTranslator: React.FC<CsvFileTranslatorProps> = ({
  parserOptions,
  onOptionsChange,
}) => {
  // 번역기 옵션 설정
  const csvFileTranslatorOptions: BaseTranslatorOptions = {
    inputLabel: 'CSV 파일 선택:',
    inputPlaceholder: '',
    resultFileType: 'text/csv',

    // 번역 타입
    translationType: TranslationType.CsvFile,

    // 파일 업로더 설정
    fileExtension: '.csv',
    fileLabel: 'CSV 파일',
  };

  // 출력 포맷 함수
  const formatOutput = (output: string): string => {
    return output;
  };

  return (
    <BaseTranslator<CsvParserOptionsDto>
      options={csvFileTranslatorOptions}
      parseChannel={IpcChannel.ParseCsvFile}
      applyChannel={IpcChannel.ApplyTranslationToCsvFile}
      formatOutput={formatOutput}
      parserOptions={parserOptions}
      onOptionsChange={onOptionsChange}
    />
  );
};

export default CsvFileTranslator;
