import { TextPath, TranslatedTextPath } from '../../../types/common';
import { BaseParseOptionsDto } from '../dto/base-parse-options.dto';

export interface IParserService<
  TargetFormat,
  ParserOptions extends BaseParseOptionsDto,
  ParsedInformation = TextPath,
  TranslatedInformation = TranslatedTextPath,
> {
  readFile(filePath: string, options: ParserOptions): TargetFormat;

  readString(content: string, options: ParserOptions): TargetFormat;

  getTranslationTargets(
    source: string,
    options: ParserOptions,
    isFile: boolean
  ): ParsedInformation[];

  applyTranslation(
    source: string,
    translations: TranslatedInformation[],
    options: ParserOptions,
    isFile: boolean
  ): TargetFormat;
}
