import { TranslationInput } from '../domain/translation-input';
import { TranslationUnit } from '../domain/translation-unit';
import { IParser } from './i-parser';
import { extractSingleText } from './utils/extract-single-text';
import { normalizeLineEndings } from './utils/normalize-line-endings';
import { SubtitleParserOptionsDto } from '@/react/unified/domain/options/subtitle-parser-options.dto';
import { SubtitleFormat } from '@/react/unified/domain/options/subtitle-format.enum';

interface SubtitleBlock {
  id: string;
  timeInfo: string;
  text: string;
  format: SubtitleFormat;
}

export class SubtitleParser
  implements IParser<TranslationInput<SubtitleParserOptionsDto>, TranslationUnit[]>
{
  private originalBlocks: SubtitleBlock[] = [];

  async parse(input: TranslationInput<SubtitleParserOptionsDto>): Promise<TranslationUnit[]> {
    const raw = await extractSingleText(input);
    const content = normalizeLineEndings(raw);
    if (content === '') return [];

    const userFormat = input.options?.format;
    const format = this.resolveFormat(userFormat, content);
    this.originalBlocks = this.parseSubtitleBlocks(content, format);

    return this.originalBlocks
      .filter((block) => block.text.trim().length > 0)
      .map((block, index) => ({
        key: `subtitle.${index}`,
        source: block.text,
      }));
  }

  public getOriginalBlocks(): SubtitleBlock[] {
    return this.originalBlocks;
  }

  private resolveFormat(userFormat: SubtitleFormat | undefined, content: string): SubtitleFormat {
    if (userFormat && userFormat !== SubtitleFormat.AUTO) {
      return userFormat === SubtitleFormat.VTT ? SubtitleFormat.VTT : SubtitleFormat.SRT;
    }
    if (content.trim().startsWith('WEBVTT')) return SubtitleFormat.VTT;
    return SubtitleFormat.SRT;
  }

  private parseSubtitleBlocks(content: string, format: SubtitleFormat): SubtitleBlock[] {
    const normalizedContent = content; // already normalized
    if (format === SubtitleFormat.VTT) {
      return this.parseVttBlocks(normalizedContent);
    }
    return this.parseSrtBlocks(normalizedContent);
  }

  private parseSrtBlocks(content: string): SubtitleBlock[] {
    const blockParts = content.split('\n\n').filter((block) => block.trim() !== '');
    return blockParts.map((block) => {
      const lines = block.split('\n');
      const id = lines[0]?.trim() || '';
      const timeInfo = lines[1]?.trim() || '';
      const text = lines.slice(2).join('\n').trim();
      return { id, timeInfo, text, format: SubtitleFormat.SRT };
    });
  }

  private parseVttBlocks(content: string): SubtitleBlock[] {
    const withoutHeader = content.replace(/^WEBVTT.*?\n\n/s, '');
    const blockParts = withoutHeader.split('\n\n').filter((block) => block.trim() !== '');
    return blockParts.map((block) => {
      const lines = block.split('\n');
      let id = '';
      let timeInfoIndex = 0;
      if (lines[0] && !lines[0].includes('-->')) {
        id = lines[0].trim();
        timeInfoIndex = 1;
      }
      const timeInfo = lines[timeInfoIndex]?.trim() || '';
      const text = lines
        .slice(timeInfoIndex + 1)
        .join('\n')
        .trim();
      return { id, timeInfo, text, format: SubtitleFormat.VTT };
    });
  }
}
