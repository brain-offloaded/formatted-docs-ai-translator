import { BaseParseOptionsDto } from './base-parse-options.dto';

export class SpreadsheetParserOptionsDto extends BaseParseOptionsDto {
  skipFirstLine?: boolean;
  targetColumns?: string;
}
