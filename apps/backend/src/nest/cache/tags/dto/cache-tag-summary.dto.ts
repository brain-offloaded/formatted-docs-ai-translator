import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CacheTagSummaryDto {
  @ApiProperty({
    description: '캐시 태그 ID',
    example: 7,
  })
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty({
    description: '캐시 태그 이름',
    example: '기본',
  })
  @IsString()
  @Expose()
  name: string;

  @ApiProperty({
    description: '태그가 생성된 시각',
    example: '2024-10-01T08:00:00.000Z',
  })
  @IsDateString()
  @Expose()
  createdAt: string;

  @ApiProperty({
    description: '태그가 마지막으로 수정된 시각',
    example: '2024-11-01T08:00:00.000Z',
  })
  @IsDateString()
  @Expose()
  updatedAt: string;

  @ApiProperty({
    description: '태그가 마지막으로 사용된 시각',
    example: '2024-12-05T10:00:00.000Z',
    nullable: true,
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  @Expose()
  lastUsedAt?: string | null;

  @ApiProperty({
    description: '태그에 연결된 번역 개수',
    example: 54,
  })
  @IsInt()
  @Expose()
  translationCount: number;
}
