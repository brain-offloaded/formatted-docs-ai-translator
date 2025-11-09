import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CacheTranslationDto {
  @ApiProperty({
    description: '번역 캐시 ID',
    example: 42,
  })
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty({
    description: '원본 텍스트',
    example: 'Hello',
  })
  @IsString()
  @Expose()
  source: string;

  @ApiProperty({
    description: '번역된 텍스트',
    example: '안녕하세요',
  })
  @IsString()
  @Expose()
  target: string;

  @ApiProperty({
    description: '항목이 생성된 시각',
    example: '2024-12-01T12:34:56.000Z',
  })
  @IsDateString()
  @Expose()
  createdAt: string;

  @ApiProperty({
    description: '마지막으로 접근된 시각',
    example: '2024-12-10T09:20:00.000Z',
  })
  @IsDateString()
  @Expose()
  lastAccessedAt: string;

  @ApiProperty({
    description: '연결된 캐시 태그 이름',
    example: '일반',
  })
  @IsString()
  @Expose()
  cacheTag: string;

  @ApiProperty({
    description: '연결된 캐시 태그 ID, 없을 경우 null',
    example: 3,
    nullable: true,
    required: false,
    type: Number,
  })
  @IsInt()
  @IsOptional()
  @Expose()
  cacheTagId: number | null;

  @ApiProperty({
    description: '연관된 파일 이름',
    example: 'document.txt',
    nullable: true,
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  @Expose()
  fileName?: string | null;

  @ApiProperty({
    description: '연관된 파일 경로',
    example: '/Users/username/Documents/document.txt',
    nullable: true,
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  @Expose()
  filePath?: string | null;
}
