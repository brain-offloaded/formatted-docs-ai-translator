import { BaseParseOptionsDto } from './base-parse-options.dto';
import { SubtitleFormatEnum } from './subtitle-format.enum';

/**
 * 자막 파일(SRT, VTT) 파싱 옵션
 */
export class SubtitleParserOptionsDto extends BaseParseOptionsDto {
  /**
   * 자막 파일 형식 (SRT 또는 VTT)
   * @default SubtitleFormatEnum.AUTO
   */
  format?: SubtitleFormatEnum;

  /**
   * 번역 시 ID, 시간 정보 등 메타데이터를 제외할지 여부
   * @default true
   */
  excludeMetadata?: boolean;
}
