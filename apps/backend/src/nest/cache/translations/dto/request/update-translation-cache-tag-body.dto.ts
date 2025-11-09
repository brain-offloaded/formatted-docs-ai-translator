import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateTranslationCacheTagBodyDto {
  @ApiProperty({
    description: '변경할 캐시 태그 ID',
    example: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Expose()
  cacheTagId: number;
}
