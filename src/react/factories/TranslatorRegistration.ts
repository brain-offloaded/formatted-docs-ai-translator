import { TranslationType } from '../contexts/TranslationContext';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { TranslatorFactory, TranslatorConfig } from './TranslatorFactory';
import { ParseOptionsFactory, ParseOptionsConfig } from './ParseOptionsFactory';
import { OptionType } from '../components/options/DynamicOptions';
import { SubtitleFormatEnum } from '@/nest/parser/dto/options/subtitle-format.enum';

/**
 * 모든 번역기와 파싱 옵션을 등록하는 함수
 */
export function registerAllTranslators(): void {
  // JSON 번역기 등록
  registerJsonTranslator();

  // 텍스트 번역기 등록
  registerTextTranslator();

  // CSV 파일 번역기 등록
  registerCsvTranslator();

  // 자막 번역기 등록
  registerSubtitleTranslator();
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
      translationType: TranslationType.Json,
      inputFieldRows: 10,
      fileExtension: '.json',
      fileLabel: 'JSON 파일',
    },
    // 통합된 채널 사용
    parseChannel: IpcChannel.ParseJson,
    applyChannel: IpcChannel.ApplyTranslationToJson,
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
function registerCsvTranslator(): void {
  // 번역기 설정
  const csvTranslatorConfig: TranslatorConfig = {
    options: {
      inputLabel: 'CSV 입력:',
      inputPlaceholder: '',
      translationType: TranslationType.Csv,
      fileExtension: '.csv',
      fileLabel: 'CSV',
    },
    parseChannel: IpcChannel.ParseCsv,
    applyChannel: IpcChannel.ApplyTranslationToCsv,
    formatOutput: (output: string): string => output,
  };

  // 파싱 옵션 설정
  const csvParseOptionsConfig: ParseOptionsConfig = {
    label: 'CSV 파싱 옵션',
    optionItems: [
      {
        key: 'delimiter',
        label: 'csv 구분자',
        type: OptionType.SHORT_STRING,
        description: '구분자 (기본값: ,)',
      },
      {
        key: 'replaceDelimiter',
        label: 'csv 구분자 대체용',
        type: OptionType.SHORT_STRING,
        description: '번역 결과에 사용할 대체 구분자 (기본값: ;)',
      },
      {
        key: 'skipFirstLine',
        label: '첫 줄 건너뛰기',
        type: OptionType.BOOLEAN,
        description: '첫 번째 줄 건너뛰기 (헤더가 있는 경우)',
      },
    ],
  };

  // 번역기와 파싱 옵션 등록
  TranslatorFactory.registerTranslator(TranslationType.Csv, csvTranslatorConfig);
  ParseOptionsFactory.registerParseOptions(TranslationType.Csv, csvParseOptionsConfig);
}

/**
 * 자막(SRT/VTT) 번역기 등록
 */
function registerSubtitleTranslator(): void {
  // 번역기 설정
  const subtitleTranslatorConfig: TranslatorConfig = {
    options: {
      inputLabel: '자막 입력:',
      inputPlaceholder: '번역할 자막을 입력하거나 파일을 업로드하세요...',
      translationType: TranslationType.Subtitle,
      inputFieldRows: 10,
      fileExtension: '.srt,.vtt',
      fileLabel: '자막 파일 (SRT/VTT)',
    },
    parseChannel: IpcChannel.ParseSubtitle,
    applyChannel: IpcChannel.ApplyTranslationToSubtitle,
    formatOutput: (output: string, isFileMode: boolean): string => {
      if (isFileMode) {
        return '자막 번역이 완료되었습니다. 다운로드 버튼을 클릭하여 결과를 받으세요.';
      }
      return output;
    },
  };

  // 파싱 옵션 설정
  const subtitleParseOptionsConfig: ParseOptionsConfig = {
    label: '자막 파싱 옵션',
    optionItems: [
      {
        key: 'format',
        label: '자막 형식',
        type: OptionType.ENUM,
        description: '자막 파일 형식 (자동 감지, SRT, VTT)',
        enumOptions: [
          { value: SubtitleFormatEnum.AUTO, label: '자동 감지' },
          { value: SubtitleFormatEnum.SRT, label: 'SRT' },
          { value: SubtitleFormatEnum.VTT, label: 'VTT (WebVTT)' },
        ],
      },
    ],
  };

  // 번역기와 파싱 옵션 등록
  TranslatorFactory.registerTranslator(TranslationType.Subtitle, subtitleTranslatorConfig);
  ParseOptionsFactory.registerParseOptions(TranslationType.Subtitle, subtitleParseOptionsConfig);
}
