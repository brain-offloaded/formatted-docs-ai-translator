import { TranslationExportImport } from '@/types/cache';
import { BaseResponseDto } from '@/types/ipc/base-response';

export class ExportTranslationsResponseDto extends BaseResponseDto {
  translations?: TranslationExportImport[];
}
