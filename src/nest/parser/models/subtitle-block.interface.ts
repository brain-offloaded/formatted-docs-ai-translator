import { SubtitleFormatEnum } from '../dto/options/subtitle-format.enum';

/**
 * 자막 블록 구조체
 */
export interface SubtitleBlock {
  /** 자막 ID 또는 인덱스 */
  id: string;
  /** 시간 정보 (00:00:00,000 --> 00:00:00,000) */
  timeInfo: string;
  /** 자막 텍스트 */
  text: string;
  /** 자막 형식 */
  format: SubtitleFormatEnum.SRT | SubtitleFormatEnum.VTT;
}
