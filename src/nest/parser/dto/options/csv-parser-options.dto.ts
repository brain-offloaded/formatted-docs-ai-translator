import { BaseParseOptionsDto } from './base-parse-options.dto';

export class CsvParserOptionsDto extends BaseParseOptionsDto {
  delimiter: string;
  replaceDelimiter: string;
  skipFirstLine: boolean;
}
