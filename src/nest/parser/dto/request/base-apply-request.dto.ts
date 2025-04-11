import { TranslatedTextPath } from '@/types/common';
import { BaseParseOptionsDto } from '../base-parse-options.dto';

export class BaseApplyRequestDto<
  TOptions extends BaseParseOptionsDto = BaseParseOptionsDto,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TExtra = any,
> {
  content: string;
  translatedTextPaths: TranslatedTextPath<TExtra>[];
  options: TOptions;
}
