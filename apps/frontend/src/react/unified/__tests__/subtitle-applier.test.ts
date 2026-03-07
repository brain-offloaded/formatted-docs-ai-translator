import { SubtitleApplier } from '@/react/unified/applier/subtitle-applier';
import { SubtitleFormat } from '@/react/unified/domain/options/subtitle-format.enum';
import { SubtitleParserOptionsDto } from '@/react/unified/domain/options/subtitle-parser-options.dto';
import { TranslationInput } from '@/react/unified/domain/translation-input';
import { TranslationUnit } from '@/react/unified/domain/translation-unit';
import type { AiTranslatorConfig } from '@/react/types/config';

const dummyConfig = {} as AiTranslatorConfig;

const buildInput = (format: SubtitleFormat) => {
  const options: SubtitleParserOptionsDto = {
    isFile: false,
    format,
  };

  return new TranslationInput('dummy subtitle content', options, dummyConfig);
};

describe('SubtitleApplier', () => {
  it('strict 실패 시 사용자 포맷 기준 파일명을 반환한다', async () => {
    const applier = new SubtitleApplier();
    const translatedTexts: TranslationUnit[] = [
      {
        key: '0',
        source: 'Hello',
        target: '안녕',
        strictFailed: true,
        strictFailureReasons: ['placeholder_mismatch'],
      },
    ];

    const output = await applier.apply(buildInput(SubtitleFormat.VTT), translatedTexts);
    const [result] = output.getResults();

    expect(result.success).toBe(false);
    expect(result.name).toBe('translated.vtt');
    expect(result.originalFileName).toBe('translated.vtt');
  });
});
