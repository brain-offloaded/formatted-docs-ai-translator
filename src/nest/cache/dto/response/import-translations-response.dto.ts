import { BaseResponseDto } from '@/types/ipc/base-response';

export class ImportTranslationsResponseDto extends BaseResponseDto {
  updatedCount?: number;
}
