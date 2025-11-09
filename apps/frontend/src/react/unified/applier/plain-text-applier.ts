import { TranslationInput } from '../domain/translation-input';
import { PlainTextParserOptionsDto } from '@/react/unified/domain/options/plain-text-parser-options.dto';
import { TranslationOutput } from '../domain/translation-output';
import { TranslationUnit } from '../domain/translation-unit';
import { IApplier } from './i-applier';
import { extractSingleText } from '../parser/utils/extract-single-text';
import { normalizeLineEndings } from '../parser/utils/normalize-line-endings';
import { deriveFileName } from '../parser/utils/derive-file-name';

export class PlainTextApplier
  implements
    IApplier<TranslationInput<PlainTextParserOptionsDto>, TranslationUnit[], TranslationOutput>
{
  async apply(
    originalInput: TranslationInput<PlainTextParserOptionsDto>,
    translatedTexts: TranslationUnit[]
  ): Promise<TranslationOutput> {
    const raw = await extractSingleText(originalInput);
    const content = normalizeLineEndings(raw);
    if (content === '') return new TranslationOutput([]); // 빈 파일이면 기존 정책 유지

    const fileName = deriveFileName(originalInput, 'translated.txt');

    // key 기반 매핑으로 누락된 번역 라인은 원문 유지
    const map = new Map(translatedTexts.map((u) => [u.key, u.target]));
    const lines = content.split('\n');
    const translatedLines = lines.map((line, index) => {
      const key = `line_${index}`;
      const target = map.get(key);
      // target 가 존재하되 빈 문자열이면(실제 번역 결과) 허용, undefined 면 원문 fallback
      return target !== undefined ? target : line;
    });
    const translatedText = translatedLines.join('\n');
    return new TranslationOutput([
      {
        name: fileName,
        success: true,
        result: translatedText,
      },
    ]);
  }
}
