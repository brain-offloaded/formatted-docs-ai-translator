import { TranslationInput } from '../domain/translation-input';
import { PlainTextParserOptionsDto } from '@/react/unified/domain/options/plain-text-parser-options.dto';
import { TranslationUnit } from '../domain/translation-unit';
import { IParser } from './i-parser';
import { extractSingleText } from './utils/extract-single-text';
import { normalizeLineEndings } from './utils/normalize-line-endings';

export class PlainTextParser
  implements IParser<TranslationInput<PlainTextParserOptionsDto>, TranslationUnit[]>
{
  async parse(input: TranslationInput<PlainTextParserOptionsDto>): Promise<TranslationUnit[]> {
    const raw = await extractSingleText(input);
    const text = normalizeLineEndings(raw);
    if (text === '') return [];

    return text.split('\n').map((line: string, index: number) => ({
      key: `line_${index}`,
      source: line,
    }));
  }
}
