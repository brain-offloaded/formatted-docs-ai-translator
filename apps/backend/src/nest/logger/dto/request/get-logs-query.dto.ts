import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { transformToStringArray } from './log-search-params.dto';

export class GetLogsQueryDto {
  @ApiProperty({
    description: '조회할 페이지 번호',
    example: 1,
    minimum: 1,
    default: 1,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiProperty({
    description: '페이지당 조회할 항목 수',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  itemsPerPage = 20;

  @ApiProperty({
    description: '필터링할 로그 레벨 목록',
    required: false,
    example: ['error', 'warn'],
    type: [String],
    minItems: 1,
    maxItems: 10,
  })
  @IsOptional()
  @Transform(({ value }) => transformToStringArray(value))
  @IsArray()
  @IsString({ each: true })
  levels?: string[];

  @ApiProperty({
    description: '조회 시작 일자 (YYYY-MM-DD 또는 YYYY/MM/DD)',
    required: false,
    example: '2024-01-01',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({
    description: '조회 종료 일자 (YYYY-MM-DD 또는 YYYY/MM/DD)',
    required: false,
    example: '2024-01-31',
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}
