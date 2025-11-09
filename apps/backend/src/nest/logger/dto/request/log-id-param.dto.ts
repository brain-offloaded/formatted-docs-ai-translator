import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class LogIdParamDto {
  @ApiProperty({
    description: '조회 대상 로그 ID',
    example: 42,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;
}
