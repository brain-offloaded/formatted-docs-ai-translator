import { TranslatedTextPath } from '@/types/common';
import { BaseParseOptionsDto } from '../base-parse-options.dto';

export class BaseApplyRequestDto<TOptions extends BaseParseOptionsDto = BaseParseOptionsDto> {
  content: string;
  translatedTextPaths: TranslatedTextPath[];
  options: TOptions;
  isFile: boolean;
}
