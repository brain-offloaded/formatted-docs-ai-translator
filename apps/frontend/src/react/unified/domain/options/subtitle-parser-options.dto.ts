import { BaseParseOptionsDto } from './base-parse-options.dto';
import { SubtitleFormat } from './subtitle-format.enum';

export class SubtitleParserOptionsDto extends BaseParseOptionsDto {
  format: SubtitleFormat;
}
