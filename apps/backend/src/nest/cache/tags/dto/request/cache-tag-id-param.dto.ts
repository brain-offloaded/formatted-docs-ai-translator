import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CacheTagIdParamDto {
  @ApiProperty({
    description: '삭제할 캐시 태그 ID',
    example: 9,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Expose()
  id: number;
}
