import { JsonParserOptionsDto } from '@/nest/parser/dto/options/json-parser-options.dto';
import { BaseApplyRequestDto } from '@/nest/parser/dto/request/base-apply-request.dto';

export class ApplyTranslationToJsonFileRequestDto extends BaseApplyRequestDto<JsonParserOptionsDto> {}
