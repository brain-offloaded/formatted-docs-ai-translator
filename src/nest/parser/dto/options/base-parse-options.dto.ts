import { SourceLanguage } from '@/utils/language';

export class BaseParseOptionsDto {
  sourceLanguage: SourceLanguage;
  /**
   * @description content가 파일 경로인지 여부. true면 파일 경로, false면 문자열 내용
   * @default false
   */
  isFile: boolean;
}
