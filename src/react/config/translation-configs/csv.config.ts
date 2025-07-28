import { TranslationConfigDefinition } from '@/react/types/translation-config-types';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { CsvParserOptionsDto } from '@/nest/parser/dto/options/csv-parser-options.dto';
import { OptionType } from '@/react/components/options/DynamicOptions';

export const csvConfig: TranslationConfigDefinition<CsvParserOptionsDto> = {
  type: 'csv',
  label: 'CSV 번역',
  translator: {
    inputLabel: 'CSV 입력:',
    inputPlaceholder: '',
    fileExtension: '.csv',
    fileLabel: 'CSV',
    ipc: {
      parse: IpcChannel.ParseCsv,
      apply: IpcChannel.ApplyTranslationToCsv,
    },
    formatOutput: (output: string): string => output,
  },
  parser: {
    options: {
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
    },
    dto: CsvParserOptionsDto,
  },
};
