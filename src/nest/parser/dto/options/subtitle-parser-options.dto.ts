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

  /**
   * 번역 시 ID, 시간 정보 등 메타데이터를 제외할지 여부
   * true로 설정 시 실제 자막 텍스트만 번역 대상에 포함
   * @default true
   */
  excludeMetadata: boolean = true;
}
