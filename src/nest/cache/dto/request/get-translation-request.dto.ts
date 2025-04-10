import { CacheSearchParams } from '@/types/common';

export class GetTranslationsRequestDto {
  page: number;
  itemsPerPage: number;
  searchParams: CacheSearchParams;
}
