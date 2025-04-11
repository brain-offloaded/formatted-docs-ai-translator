import { CsvParserOptionsDto } from '@/nest/parser/dto/options/csv-parser-options.dto';
import { BaseParseRequestDto } from '@/nest/parser/dto/request/base-parse-request.dto';

export class ParseCsvRequestDto extends BaseParseRequestDto<CsvParserOptionsDto> {}
