import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { TranslationExportImportDto } from '../translation-export-import.dto';

export class ExportTranslationsResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '내보낸 번역 목록',
    type: () => [TranslationExportImportDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationExportImportDto)
  @Expose()
  translations: TranslationExportImportDto[];
}
