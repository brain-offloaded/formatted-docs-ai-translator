import { JsonParserOptionsDto } from '@/nest/parser/dto/options/json-parser-options.dto';
import { BaseParseRequestDto } from '@/nest/parser/dto/request/base-parse-request.dto';

export class ParseJsonStringRequestDto extends BaseParseRequestDto<JsonParserOptionsDto> {}
