import { get } from 'lodash';
import { TranslationInput } from '../domain/translation-input';
import { TranslationUnit } from '../domain/translation-unit';
import { IParser } from './i-parser';
import { extractSingleText } from './utils/extract-single-text';
import { normalizeLineEndings } from './utils/normalize-line-endings';
import { JsonParserOptionsDto } from '@/react/unified/domain/options/json-parser-options.dto';
import { unwrapStringifiedJsonValues } from '@/react/unified/utils/recursive-json';

export class JsonParser
  implements IParser<TranslationInput<JsonParserOptionsDto>, TranslationUnit[]>
{
  async parse(input: TranslationInput<JsonParserOptionsDto>): Promise<TranslationUnit[]> {
    const raw = await extractSingleText(input);
    // line ending normalization not strictly necessary for JSON but keeps cache keys stable
    const text = normalizeLineEndings(raw);
    if (text === '') return [];

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error('JSON 파싱 실패: ' + (e as Error).message);
    }

    const enableRecursiveParse = input.options?.enableRecursiveParse ?? false;
    const { value: preparedJson } = unwrapStringifiedJsonValues(json, enableRecursiveParse);

    const paths = this.findAllStringPaths(preparedJson);

    return paths.map((path) => ({
      key: path,
      source:
        path === '' ? (preparedJson as string) : (get(preparedJson as object, path) as string),
    }));
  }

  private findAllStringPaths(json: unknown, basePath = ''): string[] {
    const paths: string[] = [];

    if (typeof json === 'string') {
      paths.push(basePath);
    } else if (Array.isArray(json)) {
      for (let i = 0; i < json.length; i++) {
        const newPath = `${basePath}[${i}]`;
        paths.push(...this.findAllStringPaths(json[i], newPath));
      }
    } else if (typeof json === 'object' && json !== null) {
      for (const key in json) {
        if (Object.prototype.hasOwnProperty.call(json, key)) {
          const newPath = basePath ? `${basePath}.${key}` : key;
          paths.push(...this.findAllStringPaths((json as Record<string, unknown>)[key], newPath));
        }
      }
    }

    return paths;
  }
}
