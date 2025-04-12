import { BaseParseOptionsDto } from './base-parse-options.dto';

/**
 * 자막 파일(SRT, VTT) 파싱 옵션
 */
export class SubtitleParserOptionsDto extends BaseParseOptionsDto {
  /**
   * 자막 파일 형식 (SRT 또는 VTT)
   * @default 'auto'
   */
  format?: 'auto' | 'srt' | 'vtt';

  /**
   * 번역 시 ID, 시간 정보 등 메타데이터를 제외할지 여부
   * @default true
   */
  excludeMetadata?: boolean;
}
