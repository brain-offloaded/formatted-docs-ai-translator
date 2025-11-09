import { BaseParseOptionsDto } from './base-parse-options.dto';

export class JsonParserOptionsDto extends BaseParseOptionsDto {
  /**
   * 문자열로 직렬화된 JSON 값을 재귀적으로 파싱하여
   * 중첩된 텍스트까지 추출할지 여부
   */
  enableRecursiveParse = false;
}
