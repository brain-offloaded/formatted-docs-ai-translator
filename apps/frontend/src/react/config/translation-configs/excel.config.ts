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
          key: 'targetRanges',
          label: '번역 범위',
          type: OptionType.SHORT_STRING,
          description:
            "비워두면 모든 문자열 셀. 예: B:B, B2:D100, Sheet1!C:C, 'Main Dialog'!B2:B300",
        },
        {
          key: 'excludedRanges',
          label: '제외 범위',
          type: OptionType.SHORT_STRING,
          description:
            "번역 범위보다 우선합니다. 예: A:A, Settings, Settings!A:Z, 'Do Not Translate'",
        },
        {
          key: 'skipHiddenRowsColumns',
          label: '숨김 행/열 제외',
          type: OptionType.BOOLEAN,
          description: '숨김 처리된 행과 열의 셀은 번역하지 않습니다.',
        },
      ],
    },
    dto: SpreadsheetParserOptionsDto,
  },
};
