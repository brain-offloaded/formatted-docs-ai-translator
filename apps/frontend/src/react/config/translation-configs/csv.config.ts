import { TranslationConfigDefinition } from '@/react/types/translation-config-types';
import { CsvParserOptionsDto } from '@/react/unified/domain/options/csv-parser-options.dto';
import { OptionType } from '@/react/components/options/DynamicOptions';

export const csvConfig: TranslationConfigDefinition<CsvParserOptionsDto> = {
  type: 'csv',
  label: 'CSV 번역',
  translator: {
    inputLabel: 'CSV 입력:',
    inputPlaceholder: '',
    fileExtension: '.csv',
    fileLabel: 'CSV',
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
          key: 'targetColumns',
          label: '번역할 열',
          type: OptionType.SHORT_STRING,
          description: '쉼표로 구분된 열 번호(1부터 시작) 또는 헤더 이름 (비워두면 전체 번역)',
        },
        {
          key: 'skipFirstLine',
          label: '첫 줄 건너뛰기',
          type: OptionType.BOOLEAN,
          description: '첫 번째 줄 건너뛰기 (헤더가 있는 경우)',
        },
        {
          key: 'batchRequestAcrossFiles',
          label: '파일 묶음 번역 요청',
          type: OptionType.BOOLEAN,
          description: '여러 파일을 파싱한 뒤 한 번에 번역 요청을 보냅니다.',
        },
      ],
    },
    dto: CsvParserOptionsDto,
  },
};
