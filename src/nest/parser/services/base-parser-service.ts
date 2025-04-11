import { TextPath, TranslatedTextPath } from '../../../types/common';
import { BaseParseOptionsDto } from '../dto/base-parse-options.dto';
import * as fs from 'fs/promises';

export abstract class BaseParserService<
  TargetFormat,
  ParserOptions extends BaseParseOptionsDto,
  ParsedInformation = TextPath,
  TranslatedInformation = TranslatedTextPath,
> {
  public async readFile(filePath: string, options: ParserOptions): Promise<TargetFormat> {
    const content = await fs.readFile(filePath, 'utf-8');
    return this.readString(content, options);
  }

  public async readString(content: string, _options: ParserOptions): Promise<TargetFormat> {
    return content as TargetFormat;
  }

  public async read(params: {
    source: string;
    options: ParserOptions;
    isFile: boolean;
  }): Promise<TargetFormat> {
    if (params.isFile) {
      return await this.readFile(params.source, params.options);
    }
    return await this.readString(params.source, params.options);
  }

  public abstract getTranslationTargets(params: {
    source: string;
    options: ParserOptions;
    isFile: boolean;
  }): Promise<ParsedInformation[]>;

  public abstract applyTranslation(params: {
    source: string;
    translations: TranslatedInformation[];
    options: ParserOptions;
    isFile: boolean;
  }): Promise<TargetFormat>;
}
