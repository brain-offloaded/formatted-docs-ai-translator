import { TranslatedTextPath } from '@/types/common';

export class TranslateTextArrayResponseDto {
  success: boolean;
  message: string;
  translatedTextPaths: TranslatedTextPath<unknown>[];
}
