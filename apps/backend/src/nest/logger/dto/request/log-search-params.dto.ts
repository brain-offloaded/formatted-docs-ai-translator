import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

export const transformToStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter((item) => item.length > 0);
  }

  const stringValue = String(value).trim();
  return stringValue.length > 0 ? [stringValue] : [];
};

export class LogSearchParamsDto {
  @ApiProperty({
    description: '필터링할 로그 레벨 목록',
    required: false,
    type: [String],
    example: ['error', 'warn'],
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
