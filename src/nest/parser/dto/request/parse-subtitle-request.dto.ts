import { SubtitleParserOptionsDto } from '@/nest/parser/dto/options/subtitle-parser-options.dto';
import { BaseParseRequestDto } from '@/nest/parser/dto/request/base-parse-request.dto';

/**
 * 자막(SRT, VTT) 파싱 요청 DTO
 */
export class ParseSubtitleRequestDto extends BaseParseRequestDto<SubtitleParserOptionsDto> {}
