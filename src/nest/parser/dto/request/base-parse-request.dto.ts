import { BaseParseOptionsDto } from '../base-parse-options.dto';

export class BaseParseRequestDto<TOptions extends BaseParseOptionsDto = BaseParseOptionsDto> {
  content: string;
  options: TOptions;
}
