import { BaseParseOptionsDto } from '../base-parse-options.dto';

export class BaseParseRequestDto<TOptions extends BaseParseOptionsDto = BaseParseOptionsDto> {
  /**
   * @description 파싱 대상. 파일 경로, 대상 텍스트 문자열 등등 가능.
   */
  content: string;
  /**
   * @description 파싱 옵션
   */
  options: TOptions;
  /**
   * @description content가 파일 경로인지 여부. true면 파일 경로, false면 문자열 내용
   */
  isFile: boolean;
}
