import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { CacheTagSummaryDto } from '../cache-tag-summary.dto';

export class GetCacheTagsResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '캐시 태그 목록',
    type: () => [CacheTagSummaryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CacheTagSummaryDto)
  @Expose()
  cacheTags: CacheTagSummaryDto[];
}
