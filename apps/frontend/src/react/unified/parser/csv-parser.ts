import { CsvParserOptionsDto } from '@/react/unified/domain/options/csv-parser-options.dto';
import { TranslationInput } from '../domain/translation-input';
import { TranslationUnit } from '../domain/translation-unit';
import { IParser } from './i-parser';
import { extractSingleText } from './utils/extract-single-text';
import { normalizeLineEndings } from './utils/normalize-line-endings';
import { resolveTargetColumns } from './utils/resolve-target-columns';

export class CsvParser
  implements IParser<TranslationInput<CsvParserOptionsDto>, TranslationUnit[]>
{
  async parse(input: TranslationInput<CsvParserOptionsDto>): Promise<TranslationUnit[]> {
    const raw = await extractSingleText(input);
    const content = normalizeLineEndings(raw);
    if (content === '') return [];

    const { options } = input;
    const { delimiter, skipFirstLine, targetColumns } = options;

    const lines = content.split('\n');
    const startIndex = skipFirstLine ? 1 : 0;
    const targetColumnSet = resolveTargetColumns(targetColumns, lines, delimiter);
    const shouldTranslateAll = targetColumnSet === null;

    const units: TranslationUnit[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const cells = line.split(delimiter);
      for (let j = 0; j < cells.length; j++) {
        if (!shouldTranslateAll && targetColumnSet && !targetColumnSet.has(j)) {
          continue;
        }
        const cell = cells[j].trim();
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
