import { TranslationType } from '../contexts/TranslationContext';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { TranslatorFactory, TranslatorConfig } from './TranslatorFactory';
import { ParseOptionsFactory, ParseOptionsConfig } from './ParseOptionsFactory';
import { OptionType } from '../components/options/DynamicOptions';

/**
 * 모든 번역기와 파싱 옵션을 등록하는 함수
 */
export function registerAllTranslators(): void {
  // JSON 파일 번역기 등록
  registerJsonFileTranslator();

  // JSON 문자열 번역기 등록
  registerJsonStringTranslator();

  // 텍스트 번역기 등록
  registerTextTranslator();

  // CSV 파일 번역기 등록
  registerCsvFileTranslator();
}

/**
 * JSON 파일 번역기 등록
 */
function registerJsonFileTranslator(): void {
  // 번역기 설정
  const jsonFileTranslatorConfig: TranslatorConfig = {
    options: {
      inputLabel: 'JSON 파일 선택:',
      inputPlaceholder: '',
      resultFileType: 'application/json',
      translationType: TranslationType.JsonFile,
      fileExtension: '.json',
      fileLabel: 'JSON 파일',
    },
    parseChannel: IpcChannel.ParseJsonFile,
    applyChannel: IpcChannel.ApplyTranslationToJsonFile,
    formatOutput: (output: string): string => output,
  };

  // 파싱 옵션 설정
  const jsonFileParseOptionsConfig: ParseOptionsConfig = {
    label: 'JSON 파일 파싱 옵션',
  };

  // 번역기와 파싱 옵션 등록
  TranslatorFactory.registerTranslator(TranslationType.JsonFile, jsonFileTranslatorConfig);
  ParseOptionsFactory.registerParseOptions(TranslationType.JsonFile, jsonFileParseOptionsConfig);
}

/**
 * JSON 문자열 번역기 등록
 */
function registerJsonStringTranslator(): void {
  // 번역기 설정
  const jsonStringTranslatorConfig: TranslatorConfig = {
    options: {
      inputLabel: 'JSON 문자열 입력:',
      inputPlaceholder: '{ "key": "번역할 텍스트" }',
      resultFileType: 'application/json',
      translationType: TranslationType.JsonString,
      inputFieldRows: 10,
    },
    parseChannel: IpcChannel.ParseJsonString,
    applyChannel: IpcChannel.ApplyTranslationToJsonString,
    formatOutput: (output: string): string => output,
  };

  // 파싱 옵션 설정
  const jsonStringParseOptionsConfig: ParseOptionsConfig = {
    label: 'JSON 문자열 파싱 옵션',
  };

  // 번역기와 파싱 옵션 등록
  TranslatorFactory.registerTranslator(TranslationType.JsonString, jsonStringTranslatorConfig);
  ParseOptionsFactory.registerParseOptions(
    TranslationType.JsonString,
    jsonStringParseOptionsConfig
  );
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
      inputFieldRows: 10,
    },
    parseChannel: IpcChannel.ParsePlainText,
    applyChannel: IpcChannel.ApplyTranslationToPlainText,
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
      fileExtension: '.csv',
      fileLabel: 'CSV 파일',
    },
    parseChannel: IpcChannel.ParseCsvFile,
    applyChannel: IpcChannel.ApplyTranslationToCsvFile,
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
