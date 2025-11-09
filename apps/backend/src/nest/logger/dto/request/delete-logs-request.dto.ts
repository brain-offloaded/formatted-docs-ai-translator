import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, ValidateNested } from 'class-validator';

import { LogSearchParamsDto } from './log-search-params.dto';

export class DeleteLogsRequestDto {
  @ApiProperty({
    description: '삭제할 로그 ID 목록',
    required: false,
    type: [Number],
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  logIds?: number[];

  @ApiProperty({
    description: '검색 조건과 일치하는 로그를 삭제할 때 사용하는 필터',
    required: false,
    type: () => LogSearchParamsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LogSearchParamsDto)
  searchParams?: LogSearchParamsDto;
}
