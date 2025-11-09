import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, ValidateNested } from 'class-validator';

import { CacheTranslationsSearchParamsDto } from './cache-translations-search-params.dto';

export class DeleteCacheTranslationsRequestDto {
  @ApiProperty({
    description: '삭제할 번역 ID 목록',
    example: [1, 2, 3],
    required: false,
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @IsOptional()
  @Type(() => Number)
  @Expose()
  translationIds?: number[];

  @ApiProperty({
    description: '검색 조건에 해당하는 모든 번역 삭제 시 사용되는 조건',
    required: false,
    type: () => CacheTranslationsSearchParamsDto,
  })
  @ValidateNested()
  @IsOptional()
  @Type(() => CacheTranslationsSearchParamsDto)
  @Expose()
  searchParams?: CacheTranslationsSearchParamsDto;
}
