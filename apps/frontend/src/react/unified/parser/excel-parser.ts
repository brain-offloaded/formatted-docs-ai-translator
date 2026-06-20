import { SpreadsheetParserOptionsDto } from '@/react/unified/domain/options/spreadsheet-parser-options.dto';
import { TranslationInput } from '../domain/translation-input';
import { TranslationUnit } from '../domain/translation-unit';
import { IParser } from './i-parser';
import {
  buildWorksheetCellKey,
  extractCellDisplayText,
  loadWorkbookFromBuffer,
  shouldTranslateExcelCell,
} from './utils/excel-utils';

export class ExcelParser
  implements IParser<TranslationInput<SpreadsheetParserOptionsDto>, TranslationUnit[]>
{
  async parse(input: TranslationInput<SpreadsheetParserOptionsDto>): Promise<TranslationUnit[]> {
    if (!(input.content instanceof File)) {
      throw new Error('엑셀 번역은 파일 입력만 지원합니다.');
    }

    const workbook = await loadWorkbookFromBuffer(await input.content.arrayBuffer());
    const { targetRanges, excludedRanges, skipHiddenRowsColumns } = input.options;
    const shouldSkipHidden = skipHiddenRowsColumns !== false;
    const units: TranslationUnit[] = [];

    for (const worksheet of workbook.worksheets) {
      worksheet.eachRow({ includeEmpty: false }, (row) => {
        if (shouldSkipHidden && row.hidden) {
          return;
        }

        row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
          if (shouldSkipHidden && worksheet.getColumn(columnNumber).hidden) {
            return;
          }

          if (!shouldTranslateExcelCell({ worksheet, cell, targetRanges, excludedRanges })) {
            return;
          }

          const source = extractCellDisplayText(cell);
          if (!source || source.trim() === '') {
            return;
          }

          units.push({
            key: buildWorksheetCellKey(worksheet.id, cell.address),
            source,
          });
        });
      });
    }

    return units;
  }
}
