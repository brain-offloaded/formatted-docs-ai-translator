import { BaseParseOptionsDto } from './base-parse-options.dto';

export class SpreadsheetParserOptionsDto extends BaseParseOptionsDto {
  sheets?: string;
  excludedSheets?: string;
  headerRowNumber?: string | number;
  startRowNumber?: string | number;
  skipFirstLine?: boolean;
  targetColumns?: string;
  excludedColumns?: string;
  skipHiddenRowsColumns?: boolean = true;
}
