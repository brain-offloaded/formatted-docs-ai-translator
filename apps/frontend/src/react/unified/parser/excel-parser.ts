import { SpreadsheetParserOptionsDto } from '@/react/unified/domain/options/spreadsheet-parser-options.dto';
import { TranslationInput } from '../domain/translation-input';
import { TranslationUnit } from '../domain/translation-unit';
import { IParser } from './i-parser';
import { resolveTargetColumns } from './utils/resolve-target-columns';
import {
  buildWorksheetCellKey,
  extractCellDisplayText,
  loadWorkbookFromBuffer,
} from './utils/excel-utils';

export class ExcelParser
  implements IParser<TranslationInput<SpreadsheetParserOptionsDto>, TranslationUnit[]>
{
  async parse(input: TranslationInput<SpreadsheetParserOptionsDto>): Promise<TranslationUnit[]> {
    if (!(input.content instanceof File)) {
      throw new Error('엑셀 번역은 파일 입력만 지원합니다.');
    }

    const workbook = await loadWorkbookFromBuffer(await input.content.arrayBuffer());
    const { skipFirstLine, targetColumns } = input.options;
    const startRowNumber = skipFirstLine ? 2 : 1;
    const units: TranslationUnit[] = [];

    for (const worksheet of workbook.worksheets) {
      const headerRow = worksheet.getRow(1);
      const headerCells = Array.from({ length: headerRow.cellCount }, (_, index) => {
        const text = extractCellDisplayText(headerRow.getCell(index + 1));
        return text?.trim() ?? '';
      });
      const targetColumnSet = resolveTargetColumns(targetColumns, headerCells);
      const shouldTranslateAll = targetColumnSet === null;

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber < startRowNumber) {
          return;
        }

        row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
          if (!shouldTranslateAll && targetColumnSet && !targetColumnSet.has(columnNumber - 1)) {
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
