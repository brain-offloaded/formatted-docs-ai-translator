import { TranslatedTextPath } from '@/types/common';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class TranslateTextArrayResponseDto<TExtra = any> {
  success: boolean;
  message: string;
  translatedTextPaths: TranslatedTextPath<TExtra>[];
}
