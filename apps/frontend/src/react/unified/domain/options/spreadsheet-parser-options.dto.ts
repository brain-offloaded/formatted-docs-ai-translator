import { BaseParseOptionsDto } from './base-parse-options.dto';

export class SpreadsheetParserOptionsDto extends BaseParseOptionsDto {
  isFile = true;
  targetRanges?: string;
  excludedRanges?: string;
  skipHiddenRowsColumns?: boolean = true;
}
