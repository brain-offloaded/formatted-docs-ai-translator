import { SpreadsheetParserOptionsDto } from '@/react/unified/domain/options/spreadsheet-parser-options.dto';
import { TranslationInput } from '../domain/translation-input';
import { TranslationOutput } from '../domain/translation-output';
import { TranslationUnit } from '../domain/translation-unit';
import { IApplier } from './i-applier';
import { deriveFileName } from '../parser/utils/derive-file-name';
import {
  applyTranslatedCellText,
  loadWorkbookFromBuffer,
  parseWorksheetCellKey,
  workbookToBlob,
} from '../parser/utils/excel-utils';
import { getStrictFailureMessage } from './strict-failure';

export class ExcelApplier
  implements
    IApplier<TranslationInput<SpreadsheetParserOptionsDto>, TranslationUnit[], TranslationOutput>
{
  async apply(
    originalInput: TranslationInput<SpreadsheetParserOptionsDto>,
    translatedTexts: TranslationUnit[]
  ): Promise<TranslationOutput> {
    const fileName = deriveFileName(originalInput, 'result.xlsx');
    const strictFailureMessage = getStrictFailureMessage(translatedTexts);
    if (strictFailureMessage) {
      return new TranslationOutput([
        {
          name: fileName,
          success: false,
          message: strictFailureMessage,
          originalFileName: fileName,
        },
      ]);
    }

    if (!(originalInput.content instanceof File)) {
      throw new Error('엑셀 번역은 파일 입력만 지원합니다.');
    }

    const workbook = await loadWorkbookFromBuffer(await originalInput.content.arrayBuffer());

    for (const unit of translatedTexts) {
      if (unit.target === undefined) {
        continue;
      }

      const { worksheetId, cellAddress } = parseWorksheetCellKey(unit.key);
      const worksheet = workbook.getWorksheet(worksheetId);
      if (!worksheet) {
        continue;
      }

      const cell = worksheet.getCell(cellAddress);
      applyTranslatedCellText(cell, unit.target);
    }

    return new TranslationOutput([
      {
        name: fileName,
        success: true,
        result: await workbookToBlob(workbook),
      },
    ]);
  }
}
