import { PlainTextParserOptionsDto } from '@/nest/parser/dto/options/plain-text-parser-options.dto';
import { BaseApplyRequestDto } from '@/nest/parser/dto/request/base-apply-request.dto';

export class ApplyTranslationToPlainTextRequestDto extends BaseApplyRequestDto<PlainTextParserOptionsDto> {}
