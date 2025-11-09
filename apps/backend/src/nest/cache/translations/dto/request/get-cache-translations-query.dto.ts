import { CacheTranslationsSearchParamsDto } from './cache-translations-search-params.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class GetCacheTranslationsQueryDto extends CacheTranslationsSearchParamsDto {
  @ApiProperty({
    description: '요청할 페이지 번호 (1부터 시작)',
    example: 1,
    required: false,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Expose()
  page: number = 1;

  @ApiProperty({
    description: '페이지당 항목 수',
    example: 20,
    required: false,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  @Expose()
  itemsPerPage: number = 20;
}
