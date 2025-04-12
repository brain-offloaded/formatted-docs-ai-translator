import { SubtitleParserOptionsDto } from '@/nest/parser/dto/options/subtitle-parser-options.dto';
import { BaseApplyRequestDto } from '@/nest/parser/dto/request/base-apply-request.dto';

/**
 * 자막(SRT, VTT) 번역 적용 요청 DTO
 */
export class ApplyTranslationToSubtitleRequestDto extends BaseApplyRequestDto<
  never,
  SubtitleParserOptionsDto
> {}
