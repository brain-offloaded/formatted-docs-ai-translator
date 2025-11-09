import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';

import { LogListItemDto } from './get-logs-response.dto';

export class LogDetailDto extends LogListItemDto {
  @ApiProperty({
    description: '로그 전체 메타데이터(JSON 문자열)',
    required: false,
    nullable: true,
    type: String,
    example: '{"file":"example.png","line":42}',
  })
  @IsOptional()
  @IsString()
  @Expose()
  metadata: string | null;

  @ApiProperty({
    description: '스택 트레이스 문자열',
    required: false,
    nullable: true,
    type: String,
    example: 'Error: Something bad\n    at ...',
  })
  @IsOptional()
  @IsString()
  @Expose()
  stack: string | null;

  @ApiProperty({
    description: '파싱된 메타데이터 객체 (JSON 문자열)',
    required: false,
    nullable: true,
    type: String,
    example: '{"file":"example.png","line":42}',
  })
  @IsOptional()
  @IsString()
  @Expose()
  meta: string | null;
}

export class GetLogDetailResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '요청한 로그 상세 정보',
    required: false,
    nullable: true,
    type: () => LogDetailDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LogDetailDto)
  @Expose()
  log: LogDetailDto | null;
}
