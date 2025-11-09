import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';

export class LogListItemDto {
  @ApiProperty({
    description: '로그 ID',
    example: 1,
  })
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty({
    description: '로그 레벨',
    example: 'error',
  })
  @IsString()
  @Expose()
  level: string;

  @ApiProperty({
    description: '로그 메시지',
    example: 'Unhandled exception occurred.',
  })
  @IsString()
  @Expose()
  message: string;

  @ApiProperty({
    description: '로그 컨텍스트',
    required: false,
    nullable: true,
    example: 'ImageTranslatorService',
    type: String,
  })
  @IsOptional()
  @IsString()
  @Expose()
  context: string | null;

  @ApiProperty({
    description: '메타데이터 미리보기 문자열',
    required: false,
    nullable: true,
    example: '{"file":"example.png"}',
    type: String,
  })
  @IsOptional()
  @IsString()
  @Expose()
  metadataPreview: string | null;

  @ApiProperty({
    description: '메타데이터 존재 여부',
    example: true,
  })
  @IsBoolean()
  @Expose()
  hasMetadata: boolean;

  @ApiProperty({
    description: '로그 발생 시각 (ISO 문자열)',
    example: '2024-01-01T12:34:56.000Z',
  })
  @IsString()
  @Expose()
  timestamp: string;
}

export class GetLogsResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '로그 목록',
    type: () => [LogListItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogListItemDto)
  @Expose()
  logs: LogListItemDto[];

  @ApiProperty({
    description: '총 로그 개수',
    example: 120,
  })
  @IsInt()
  @Expose()
  totalItems: number;
}
