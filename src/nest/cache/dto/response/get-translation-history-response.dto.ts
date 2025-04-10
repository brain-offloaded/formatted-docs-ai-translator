import { TranslationHistory } from '@/types/cache';
import { BaseResponseDto } from '@/types/ipc/base-response';

export class GetTranslationHistoryResponseDto extends BaseResponseDto {
  translationHistory: TranslationHistory[];
}
