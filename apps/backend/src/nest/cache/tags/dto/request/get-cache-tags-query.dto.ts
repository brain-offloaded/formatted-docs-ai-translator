import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum CacheTagSortBy {
  LAST_USED_AT = 'lastUsedAt',
  NAME = 'name',
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetCacheTagsQueryDto {
  @ApiProperty({
    description: '태그 이름 검색 키워드',
    example: '회의',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Expose()
  keyword?: string;

  @ApiProperty({
    description: '정렬 기준',
    enum: CacheTagSortBy,
    required: false,
  })
  @IsEnum(CacheTagSortBy)
  @IsOptional()
  @Expose()
  sortBy?: CacheTagSortBy;

  @ApiProperty({
    description: '정렬 순서',
    enum: SortOrder,
    required: false,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  @Expose()
  sortOrder?: SortOrder;
}
