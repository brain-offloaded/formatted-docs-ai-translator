import { SpreadsheetParserOptionsDto } from '@/react/unified/domain/options/spreadsheet-parser-options.dto';
import { TranslationInput } from '../domain/translation-input';
import { TranslationUnit } from '../domain/translation-unit';
import { IParser } from './i-parser';
import {
  buildWorksheetCellKey,
  extractCellDisplayText,
  loadWorkbookFromBuffer,
  resolveExcelColumnSelection,
  resolveExcelRowWindow,
  shouldIncludeWorksheet,
} from './utils/excel-utils';

export class ExcelParser
  implements IParser<TranslationInput<SpreadsheetParserOptionsDto>, TranslationUnit[]>
{
  async parse(input: TranslationInput<SpreadsheetParserOptionsDto>): Promise<TranslationUnit[]> {
    if (!(input.content instanceof File)) {
      throw new Error('엑셀 번역은 파일 입력만 지원합니다.');
    }

    const workbook = await loadWorkbookFromBuffer(await input.content.arrayBuffer());
    const {
      sheets,
      excludedSheets,
      headerRowNumber: rawHeaderRowNumber,
      startRowNumber: rawStartRowNumber,
      skipFirstLine,
      targetColumns,
      excludedColumns,
      skipHiddenRowsColumns,
    } = input.options;
    const { headerRowNumber, startRowNumber } = resolveExcelRowWindow({
      headerRowNumber: rawHeaderRowNumber,
      startRowNumber: rawStartRowNumber,
      skipFirstLine,
    });
    const shouldSkipHidden = skipHiddenRowsColumns !== false;
    const units: TranslationUnit[] = [];

    for (let worksheetIndex = 0; worksheetIndex < workbook.worksheets.length; worksheetIndex++) {
      const worksheet = workbook.worksheets[worksheetIndex];
      if (!shouldIncludeWorksheet(worksheet, worksheetIndex + 1, sheets, excludedSheets)) {
        continue;
      }

      const headerRow = headerRowNumber ? worksheet.getRow(headerRowNumber) : null;
      const headerCellCount = headerRow
        ? Math.max(headerRow.cellCount, worksheet.columnCount, worksheet.actualColumnCount)
        : 0;
      const headerCells = Array.from({ length: headerCellCount }, (_, index) => {
        const text = headerRow ? extractCellDisplayText(headerRow.getCell(index + 1)) : null;
        return text?.trim() ?? '';
      });
      const targetColumnSet = resolveExcelColumnSelection(targetColumns, headerCells);
      const excludedColumnSet = resolveExcelColumnSelection(excludedColumns, headerCells);
      const shouldTranslateAll = targetColumnSet === null;

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (
          rowNumber < startRowNumber ||
          (headerRowNumber !== null && rowNumber === headerRowNumber) ||
          (shouldSkipHidden && row.hidden)
        ) {
          return;
        }

        row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
          if (shouldSkipHidden && worksheet.getColumn(columnNumber).hidden) {
            return;
          }

          if (!shouldTranslateAll && targetColumnSet && !targetColumnSet.has(columnNumber)) {
            return;
          }

          if (excludedColumnSet?.has(columnNumber)) {
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
