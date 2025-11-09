import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';

import { CacheTranslationDto } from '../cache-translation.dto';

export class GetCacheTranslationsResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '조회된 번역 목록',
    type: () => [CacheTranslationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CacheTranslationDto)
  @Expose()
  translations: CacheTranslationDto[];

  @ApiProperty({
    description: '전체 항목 수',
    example: 120,
  })
  @IsInt()
  @Min(0)
  @Expose()
  totalItems: number;
}
