import { TranslationInput } from '../domain/translation-input';
import { TranslationOutput } from '../domain/translation-output';
import { TranslationUnit } from '../domain/translation-unit';
import { IApplier } from './i-applier';
import { SubtitleParserOptionsDto } from '@/react/unified/domain/options/subtitle-parser-options.dto';
import { SubtitleFormat } from '@/react/unified/domain/options/subtitle-format.enum';
// removed unused imports (kept parser state fallback logic)
import { SubtitleParser } from '../parser/subtitle-parser';
import { deriveFileName } from '../parser/utils/derive-file-name';
import { getStrictFailureMessage } from './strict-failure';

interface SubtitleBlock {
  id: string;
  timeInfo: string;
  text: string;
  format: SubtitleFormat;
}

export class SubtitleApplier
  implements
    IApplier<TranslationInput<SubtitleParserOptionsDto>, TranslationUnit[], TranslationOutput>
{
  // parser 주입은 선택적 (state 없거나 fallback 재파싱)
  constructor(private readonly parser?: SubtitleParser) {}

  async apply(
    originalInput: TranslationInput<SubtitleParserOptionsDto>,
    translatedTexts: TranslationUnit[]
  ): Promise<TranslationOutput> {
    const fileName = deriveFileName(originalInput, 'translated.srt');
    const strictFailureMessage = getStrictFailureMessage(translatedTexts);
    if (strictFailureMessage) {
      return new TranslationOutput([
        {
          name: fileName,
          success: false,
          message: strictFailureMessage,
        },
      ]);
    }

    // 원본 블록 확보: 주입된 parser 에 상태가 없으면 재파싱 시도
    let originalBlocks: SubtitleBlock[] = [];
    if (this.parser) {
      originalBlocks = this.parser.getOriginalBlocks();
    }
    if (!originalBlocks.length) {
      // 방어적 재파싱 (state race 해결)
      const tmpParser = this.parser ?? new SubtitleParser();
      await tmpParser.parse(originalInput); // originalBlocks 내부 세팅
      originalBlocks = tmpParser.getOriginalBlocks();
    }
    let translationIndex = 0;
    const translatedBlocks = originalBlocks.map((block) => {
      if (block.text.trim().length === 0) {
        return block;
      }
      const translation = translatedTexts[translationIndex++];
      if (translation && translation.target) {
        return { ...block, text: translation.target };
      }
      return block;
    });

    let format = translatedBlocks[0]?.format || SubtitleFormat.SRT;
    // 사용자가 명시한 포맷이 있다면 그것을 우선 적용 (AUTO 제외)
    const userFormat = originalInput.options?.format;
    if (userFormat && userFormat !== SubtitleFormat.AUTO) {
      format = userFormat === SubtitleFormat.VTT ? SubtitleFormat.VTT : SubtitleFormat.SRT;
    }
    const subtitleContent = this.formatSubtitleBlocks(translatedBlocks, format);

    const outputFileName = deriveFileName(originalInput, `translated.${format}`);
    return new TranslationOutput([
      {
        name: outputFileName,
        success: true,
        result: subtitleContent,
      },
    ]);
  }

  private formatSubtitleBlocks(blocks: SubtitleBlock[], format: SubtitleFormat): string {
    if (format === SubtitleFormat.VTT) {
      return this.formatVttBlocks(blocks);
    }
    return this.formatSrtBlocks(blocks);
  }

  private formatSrtBlocks(blocks: SubtitleBlock[]): string {
    return blocks.map((block) => `${block.id}\n${block.timeInfo}\n${block.text}`).join('\n\n');
  }

  private formatVttBlocks(blocks: SubtitleBlock[]): string {
    const header = 'WEBVTT\n\n';
    const content = blocks
      .map((block) => {
        if (block.id) {
          return `${block.id}\n${block.timeInfo}\n${block.text}`;
        }
        return `${block.timeInfo}\n${block.text}`;
      })
      .join('\n\n');
    return header + content;
  }
}
