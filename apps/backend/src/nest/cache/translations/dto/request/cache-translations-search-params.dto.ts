import { CacheSearchType } from '@apps/common/dist/types/common';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';

export class CacheTranslationsSearchParamsDto {
  @ApiProperty({
    description: '검색 기준',
    enum: CacheSearchType,
    example: CacheSearchType.SOURCE,
    required: false,
  })
  @IsEnum(CacheSearchType)
  @IsOptional()
  @Expose()
  searchType?: CacheSearchType = CacheSearchType.SOURCE;

  @ApiProperty({
    description: '검색어',
    example: '예제',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Expose()
  searchValue?: string = '';

  @ApiProperty({
    description: '검색 시작일 (YYYY-MM-DD)',
    example: '2024-11-01',
    required: false,
  })
  @IsISO8601({ strict: true })
  @IsOptional()
  @Expose()
  startDate?: string;

  @ApiProperty({
    description: '검색 종료일 (YYYY-MM-DD)',
    example: '2024-12-01',
    required: false,
  })
  @IsISO8601({ strict: true })
  @IsOptional()
  @Expose()
  endDate?: string;
}
