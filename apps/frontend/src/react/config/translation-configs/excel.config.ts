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
          key: 'sheets',
          label: '번역 대상 시트',
          type: OptionType.SHORT_STRING,
          description: '비워두면 모든 시트. 예: Sheet1, 대사, 1, 1,3',
        },
        {
          key: 'excludedSheets',
          label: '제외할 시트',
          type: OptionType.SHORT_STRING,
          description: '번역하지 않을 시트 이름 또는 번호. 예: 설정, 메모, 2',
        },
        {
          key: 'headerRowNumber',
          label: '헤더 행 번호',
          type: OptionType.SHORT_STRING,
          description: '열 이름으로 사용할 행 번호. 비워두면 헤더 없음. 예: 1, 2',
        },
        {
          key: 'startRowNumber',
          label: '번역 시작 행',
          type: OptionType.SHORT_STRING,
          description:
            '앞쪽 안내/메타 행을 건너뛸 때 사용합니다. 비워두면 헤더 다음 행부터 시작합니다.',
        },
        {
          key: 'targetColumns',
          label: '번역 대상 열',
          type: OptionType.SHORT_STRING,
          description: '비워두면 모든 문자열 셀. 예: B, C:D, 2, 3:5, 원문, source_text',
        },
        {
          key: 'excludedColumns',
          label: '제외할 열',
          type: OptionType.SHORT_STRING,
          description: '번역 대상에서 제외할 열. 예: id, key, formula, A, E:G',
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
