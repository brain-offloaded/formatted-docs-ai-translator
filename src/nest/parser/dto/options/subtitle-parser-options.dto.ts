import { BaseParseOptionsDto } from './base-parse-options.dto';
import { SubtitleFormatEnum } from './subtitle-format.enum';

/**
 * 자막 파일(SRT, VTT) 파싱 옵션
 */
export class SubtitleParserOptionsDto extends BaseParseOptionsDto {
  /**
   * 자막 파일 형식
   * - auto: 파일 내용을 분석하여 자동으로 감지
   * - srt: SubRip Text 형식
   * - vtt: WebVTT 형식
   * @default SubtitleFormatEnum.AUTO
   */
  format: SubtitleFormatEnum = SubtitleFormatEnum.AUTO;
}
