import { TextPath, TranslatedTextPath } from '../../../types/common';
import { BaseParseOptionsDto } from '../dto/base-parse-options.dto';

export interface IParserService<
  TargetFormat,
  ParserOptions extends BaseParseOptionsDto,
  ParsedInformation = TextPath,
  TranslatedInformation = TranslatedTextPath,
> {
  getTranslationTargets(source: TargetFormat, options: ParserOptions): ParsedInformation[];

  applyTranslation(
    source: TargetFormat,
    translations: TranslatedInformation[],
    options: ParserOptions
  ): TargetFormat;
}
