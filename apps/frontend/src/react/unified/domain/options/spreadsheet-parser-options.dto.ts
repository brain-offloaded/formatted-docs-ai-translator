import { BaseParseOptionsDto } from './base-parse-options.dto';

export class SpreadsheetParserOptionsDto extends BaseParseOptionsDto {
  targetRanges?: string;
  excludedRanges?: string;
  skipHiddenRowsColumns?: boolean = true;
}
