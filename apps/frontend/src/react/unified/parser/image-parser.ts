import { TranslationInput } from '../domain/translation-input';
import { TranslationUnit } from '../domain/translation-unit';
import { IParser } from './i-parser';
import { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';
import { extractImageAsBase64 } from './utils/extract-image-as-base64';

export class ImageParser
  implements IParser<TranslationInput<BaseParseOptionsDto>, TranslationUnit[]>
{
  async parse(input: TranslationInput<BaseParseOptionsDto>): Promise<TranslationUnit[]> {
    const { base64, name } = await extractImageAsBase64(input);
    if (!base64) {
      return [];
    }

    return [
      {
        key: name,
        source: base64,
        target: '', // 이미지 번역의 경우 target은 후처리 단계에서 적용
      },
    ];
  }
}
