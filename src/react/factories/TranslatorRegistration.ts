import { TranslationType } from '../contexts/TranslationContext';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { TranslatorFactory, TranslatorConfig } from './TranslatorFactory';
import { ParseOptionsFactory, ParseOptionsConfig } from './ParseOptionsFactory';
import { OptionType } from '../components/options/DynamicOptions';

/**
 * 모든 번역기와 파싱 옵션을 등록하는 함수
 */
export function registerAllTranslators(): void {
  // JSON 번역기 등록
  registerJsonTranslator();
  
  // 텍스트 번역기 등록
  registerTextTranslator();
  
  // CSV 파일 번역기 등록
  registerCsvFileTranslator();
}

/**
 * JSON 번역기 등록
 */
function registerJsonTranslator(): void {
  // 번역기 설정
  const jsonTranslatorConfig: TranslatorConfig = {
    options: {
      inputLabel: 'JSON 입력:',
      inputPlaceholder: '{ "key": "번역할 텍스트" }',
      resultFileType: 'application/json',
      translationType: TranslationType.Json,
      isFileInput: false, // 기본값은 텍스트 입력 모드
      inputFieldRows: 10,
      fileExtension: '.json',
      fileLabel: 'JSON 파일',
    },
    // 두 가지 모드 모두 지원하도록 모든 채널 등록
    parseFileChannel: IpcChannel.ParseJsonFile,
    parseStringChannel: IpcChannel.ParseJsonString,
    applyFileChannel: IpcChannel.ApplyTranslationToJsonFile,
    applyStringChannel: IpcChannel.ApplyTranslationToJsonString,
    formatOutput: (output: string): string => output,
  };
  
  // 파싱 옵션 설정
  const jsonParseOptionsConfig: ParseOptionsConfig = {
    label: 'JSON 파싱 옵션',
  };
  
  // 번역기와 파싱 옵션 등록
  TranslatorFactory.registerTranslator(TranslationType.Json, jsonTranslatorConfig);
  ParseOptionsFactory.registerParseOptions(TranslationType.Json, jsonParseOptionsConfig);
}

/**
 * 텍스트 번역기 등록
 */
function registerTextTranslator(): void {
  // 번역기 설정
  const textTranslatorConfig: TranslatorConfig = {
    options: {
      inputLabel: '텍스트 입력:',
      inputPlaceholder: '번역할 텍스트를 입력하세요...',
      resultFileType: 'text/plain',
      translationType: TranslationType.Text,
      isFileInput: false, // 파일 입력 모드 비활성화
      inputFieldRows: 10,
    },
    parseStringChannel: IpcChannel.ParsePlainText, // 문자열 파싱 채널
    applyStringChannel: IpcChannel.ApplyTranslationToPlainText, // 문자열 번역 적용 채널
    formatOutput: (output: string): string => output,
  };

  // 파싱 옵션 설정
  const textParseOptionsConfig: ParseOptionsConfig = {
    label: '텍스트 파싱 옵션',
  };

  // 번역기와 파싱 옵션 등록
  TranslatorFactory.registerTranslator(TranslationType.Text, textTranslatorConfig);
  ParseOptionsFactory.registerParseOptions(TranslationType.Text, textParseOptionsConfig);
}

/**
 * CSV 파일 번역기 등록
 */
function registerCsvFileTranslator(): void {
  // 번역기 설정
  const csvFileTranslatorConfig: TranslatorConfig = {
    options: {
      inputLabel: 'CSV 파일 선택:',
      inputPlaceholder: '',
      resultFileType: 'text/csv',
      translationType: TranslationType.CsvFile,
      isFileInput: true, // 파일 입력 모드 활성화
      fileExtension: '.csv',
      fileLabel: 'CSV 파일',
    },
    parseFileChannel: IpcChannel.ParseCsvFile, // 파일 파싱 채널
    applyFileChannel: IpcChannel.ApplyTranslationToCsvFile, // 파일 번역 적용 채널
    formatOutput: (output: string): string => output,
  };

  // 파싱 옵션 설정
  const csvFileParseOptionsConfig: ParseOptionsConfig = {
    label: 'CSV 파일 파싱 옵션',
    optionItems: [
      {
        name: 'delimiter',
        type: OptionType.SHORT_STRING,
        description: '구분자 (기본값: ,)',
      },
      {
        name: 'replaceDelimiter',
        type: OptionType.SHORT_STRING,
        description: '번역 결과에 사용할 대체 구분자 (기본값: ;)',
      },
      {
        name: 'skipFirstLine',
        type: OptionType.BOOLEAN,
        description: '첫 번째 줄 건너뛰기 (헤더가 있는 경우)',
      },
    ],
  };

  // 번역기와 파싱 옵션 등록
  TranslatorFactory.registerTranslator(TranslationType.CsvFile, csvFileTranslatorConfig);
  ParseOptionsFactory.registerParseOptions(TranslationType.CsvFile, csvFileParseOptionsConfig);
}
