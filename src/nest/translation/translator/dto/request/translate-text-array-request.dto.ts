import { TextPath } from '@/types/common';
import { TranslatorConfig } from '@/types/config';

export class TranslateTextArrayRequestDto {
  config: TranslatorConfig;
  textPaths: TextPath<unknown>[];
  sourceFilePath: string;
  promptPresetContent?: string; // promptPresetContent 필드 추가
  thinkingMode?: boolean;
}
