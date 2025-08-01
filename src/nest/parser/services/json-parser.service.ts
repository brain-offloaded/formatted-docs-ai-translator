import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { get, set } from 'lodash';

import { SimpleTextPath, SimpleTranslatedTextPath } from '../../../types/common';
import { deepClone } from '../../../utils/deep-clone';
import { isLanguage } from '../../../utils/language';
import { JsonParserOptionsDto } from '@/nest/parser/dto/options/json-parser-options.dto';
import { BaseParserService } from './base-parser-service';

@Injectable()
export class JsonParserService extends BaseParserService<
  Record<string, unknown>,
  JsonParserOptionsDto,
  SimpleTextPath,
  SimpleTranslatedTextPath
> {
  readonly type = 'json';

  public async readFile(
    filePath: string,
    options: JsonParserOptionsDto
  ): Promise<Record<string, unknown>> {
    const content = await fs.readFile(filePath, 'utf-8');
    return this.readString(content, options);
  }

  public async readString(
    content: string,
    _options: JsonParserOptionsDto
  ): Promise<Record<string, unknown>> {
    return JSON.parse(content);
  }

  public async getTranslationTargets(params: {
    source: string;
    options: JsonParserOptionsDto;
  }): Promise<SimpleTextPath[]> {
    const json = await this.read(params);
    const paths = this.findAllStringPaths(json);

    return paths
      .map((path) => ({ path, text: get(json, path) as string }))
      .filter(({ text }) => isLanguage(text, params.options.sourceLanguage));
  }

  private findAllStringPaths(json: unknown, basePath: string = ''): string[] {
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

  public async applyTranslation(params: {
    source: string;
    translations: SimpleTranslatedTextPath[];
    options: JsonParserOptionsDto;
  }): Promise<Record<string, unknown>> {
    const json = await this.read(params);
    const result = deepClone(json);

    for (const { path, translatedText } of params.translations) {
      set(result, path, translatedText);
    }

    return result;
  }
}
