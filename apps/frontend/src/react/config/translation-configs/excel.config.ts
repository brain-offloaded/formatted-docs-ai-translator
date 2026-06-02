import { OptionType } from '@/react/components/options/DynamicOptions';
import { TranslationType } from '@/react/contexts/TranslationContext';
import { TranslationConfigDefinition } from '@/react/types/translation-config-types';
import { SpreadsheetParserOptionsDto } from '@/react/unified/domain/options/spreadsheet-parser-options.dto';

export const excelConfig: TranslationConfigDefinition<SpreadsheetParserOptionsDto> = {
  type: TranslationType.Excel,
  label: 'Excel 번역',
  translator: {
    inputLabel: 'Excel 입력:',
    inputPlaceholder: '',
    fileExtension: '.xlsx',
    fileLabel: 'Excel(.xlsx)',
    formatOutput: (output: string): string => output,
  },
  parser: {
    options: {
      label: 'Excel 파싱 옵션',
      optionItems: [
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
          description: '각 시트의 첫 번째 줄을 헤더로 취급하고 번역에서 제외합니다.',
        },
      ],
    },
    dto: SpreadsheetParserOptionsDto,
  },
};
