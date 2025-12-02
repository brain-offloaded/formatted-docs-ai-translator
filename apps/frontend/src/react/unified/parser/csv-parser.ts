import { CsvParserOptionsDto } from '@/react/unified/domain/options/csv-parser-options.dto';
import { TranslationInput } from '../domain/translation-input';
import { TranslationUnit } from '../domain/translation-unit';
import { IParser } from './i-parser';
import { extractSingleText } from './utils/extract-single-text';
import { normalizeLineEndings } from './utils/normalize-line-endings';
import { parseCsvContent } from './utils/csv-utils';
import { resolveTargetColumns } from './utils/resolve-target-columns';

export class CsvParser
  implements IParser<TranslationInput<CsvParserOptionsDto>, TranslationUnit[]>
{
  async parse(input: TranslationInput<CsvParserOptionsDto>): Promise<TranslationUnit[]> {
    const raw = await extractSingleText(input);
    const content = normalizeLineEndings(raw);
    if (content === '') return [];

    const { options } = input;
    const {
      delimiter: rawDelimiter,
      skipFirstLine,
      targetColumns,
      useQuoteEscaping = true,
    } = options;
    const delimiter = rawDelimiter ?? ',';

    const rows = parseCsvContent(content, delimiter, useQuoteEscaping);
    if (rows.length === 0) return [];

    const startIndex = skipFirstLine ? 1 : 0;
    const headerCells = rows[0] ?? [];
    const targetColumnSet = resolveTargetColumns(targetColumns, headerCells);
    const shouldTranslateAll = targetColumnSet === null;

    const units: TranslationUnit[] = [];
    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every((cell) => cell === '')) continue;

      for (let j = 0; j < row.length; j++) {
        if (!shouldTranslateAll && targetColumnSet && !targetColumnSet.has(j)) {
          continue;
        }
        const cell = row[j].trim();
        if (!cell) continue;

        units.push({
          key: `${i},${j}`,
          source: cell,
        });
      }
    }

    return units;
  }
}
