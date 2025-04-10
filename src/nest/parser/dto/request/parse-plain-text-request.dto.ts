import { PlainTextParserOptionsDto } from '@/nest/parser/dto/options/plain-text-parser-options.dto';
import { BaseParseRequestDto } from '@/nest/parser/dto/request/base-parse-request.dto';

export class ParsePlainTextRequestDto extends BaseParseRequestDto<PlainTextParserOptionsDto> {}
