import { TextPath } from '@/types/common';
import { TranslatorConfig } from '@/types/config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class TranslateTextArrayRequestDto<TExtra = any> {
  config: TranslatorConfig;
  textPaths: TextPath<TExtra>[];
  sourceFilePath: string;
}
