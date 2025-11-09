import { CsvParserOptionsDto } from '@/react/unified/domain/options/csv-parser-options.dto';
import { TranslationInput } from '../domain/translation-input';
import { TranslationOutput } from '../domain/translation-output';
import { TranslationUnit } from '../domain/translation-unit';
import { IApplier } from './i-applier';
import { extractSingleText } from '../parser/utils/extract-single-text';
import { normalizeLineEndings } from '../parser/utils/normalize-line-endings';
import { deriveFileName } from '../parser/utils/derive-file-name';
import { resolveTargetColumns } from '../parser/utils/resolve-target-columns';

export class CsvApplier
  implements IApplier<TranslationInput<CsvParserOptionsDto>, TranslationUnit[], TranslationOutput>
{
  async apply(
    originalInput: TranslationInput<CsvParserOptionsDto>,
    translatedTexts: TranslationUnit[]
  ): Promise<TranslationOutput> {
    const fileName = deriveFileName(originalInput, 'result.csv');

    const raw = await extractSingleText(originalInput);
    const content = normalizeLineEndings(raw);
    if (content === '')
      return new TranslationOutput([
        {
          name: fileName,
          success: true,
          result: '',
        },
      ]);

    const {
      options: { delimiter, replaceDelimiter, targetColumns },
    } = originalInput;

    const lines = content.split('\n');
    const translatedMap = new Map(translatedTexts.map((unit) => [unit.key, unit]));
    const targetColumnSet = resolveTargetColumns(targetColumns, lines, delimiter);
    const shouldApplyAll = targetColumnSet === null;

    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    for (let i = 0; i < lines.length; i++) {
      const cells = lines[i].split(delimiter);
      for (let j = 0; j < cells.length; j++) {
        if (!shouldApplyAll && targetColumnSet && !targetColumnSet.has(j)) {
          continue;
        }
        const key = `${i},${j}`;
        const unit = translatedMap.get(key);
        if (unit && unit.target !== undefined) {
          let translated = unit.target;
          if (replaceDelimiter) {
            const pattern = new RegExp(escapeRegex(delimiter), 'g');
            translated = translated.replace(pattern, replaceDelimiter);
          }
          cells[j] = translated;
        }
      }
      lines[i] = cells.join(delimiter);
    }

    return new TranslationOutput([
      {
        name: fileName,
        success: true,
        result: lines.join('\n'),
      },
    ]);
  }
}
