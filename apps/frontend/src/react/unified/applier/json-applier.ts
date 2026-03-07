import { set } from 'lodash';
import { deepClone } from '../../utils/deep-clone';
import { TranslationInput } from '../domain/translation-input';
import { TranslationOutput } from '../domain/translation-output';
import { TranslationUnit } from '../domain/translation-unit';
import { IApplier } from './i-applier';
import { JsonParserOptionsDto } from '@/react/unified/domain/options/json-parser-options.dto';
import { extractSingleText } from '../parser/utils/extract-single-text';
import { normalizeLineEndings } from '../parser/utils/normalize-line-endings';
import { deriveFileName } from '../parser/utils/derive-file-name';
import {
  rewrapStringifiedJsonValues,
  unwrapStringifiedJsonValues,
} from '@/react/unified/utils/recursive-json';
import { getStrictFailureMessage } from './strict-failure';

export class JsonApplier
  implements IApplier<TranslationInput<JsonParserOptionsDto>, TranslationUnit[], TranslationOutput>
{
  async apply(
    originalInput: TranslationInput<JsonParserOptionsDto>,
    translatedTexts: TranslationUnit[]
  ): Promise<TranslationOutput> {
    const fileName = deriveFileName(originalInput, 'translated.json');
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

    const raw = await extractSingleText(originalInput);
    const content = normalizeLineEndings(raw); // 안정적 처리
    if (content === '')
      return new TranslationOutput([
        {
          name: fileName,
          success: true,
          result: '',
        },
      ]);

    const json = JSON.parse(content);
    const enableRecursiveParse = originalInput.options?.enableRecursiveParse ?? false;
    const { value: preparedJson, stringifiedPaths } = unwrapStringifiedJsonValues(
      json,
      enableRecursiveParse
    );

    // 루트가 primitive(string 등) 인 경우 특별 처리 (parser 는 key '' 로 제공)
    if (typeof preparedJson === 'string') {
      const rootUnit = translatedTexts.find((u) => u.key === '' && u.target !== undefined);
      const finalValue = rootUnit ? rootUnit.target : preparedJson;
      const translatedJson = JSON.stringify(finalValue, null, 2);
      return new TranslationOutput([
        {
          name: fileName,
          success: true,
          result: translatedJson,
        },
      ]);
    }

    const result = deepClone(preparedJson) as object;
    for (const { key, target } of translatedTexts) {
      if (target !== undefined) {
        set(result, key, target);
      }
    }
    const restored = rewrapStringifiedJsonValues(result, stringifiedPaths);
    const translatedJson = JSON.stringify(restored, null, 2);
    return new TranslationOutput([
      {
        name: fileName,
        success: true,
        result: translatedJson,
      },
    ]);
  }
}
