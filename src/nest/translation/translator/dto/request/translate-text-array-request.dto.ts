import { TextPath } from '@/types/common';
import { TranslatorConfig } from '@/types/config';

export class TranslateTextArrayRequestDto {
  config: TranslatorConfig;
  textPaths: TextPath<unknown>[];
  sourceFilePath: string;
}
