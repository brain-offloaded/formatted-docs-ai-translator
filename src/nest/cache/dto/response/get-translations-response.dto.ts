import { BaseResponseDto } from '@/types/ipc/base-response';
import { CacheTranslation } from '@/types/cache';

export class GetTranslationsResponseDto extends BaseResponseDto {
  translations: Array<CacheTranslation>;
  totalItems: number;
}
