import { CsvParserOptionsDto } from '@/nest/parser/dto/options/csv-parser-options.dto';
import { BaseParseRequestDto } from '@/nest/parser/dto/request/base-parse-request.dto';

export class ParseCsvFileRequestDto extends BaseParseRequestDto<CsvParserOptionsDto> {}
