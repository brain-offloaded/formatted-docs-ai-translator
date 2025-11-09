import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class TranslationHistoryDto {
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
    description: '번역 성공 여부',
    example: true,
  })
  @IsBoolean()
  @Expose()
  success: boolean;

  @ApiProperty({
    description: '번역 실패 시 오류 메시지',
    example: 'Rate limit exceeded',
    nullable: true,
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  @Expose()
  error?: string | null;

  @ApiProperty({
    description: '번역 요청에 사용된 모델 이름',
    example: 'gpt-4o-mini',
  })
  @IsString()
  @Expose()
  model: string;

  @ApiProperty({
    description: '이력이 기록된 시각',
    example: '2024-12-10T12:00:00.000Z',
  })
  @IsDateString()
  @Expose()
  createdAt: string;

  @ApiProperty({
    description: '번역 시 사용된 캐시 태그 이름',
    example: '일반',
  })
  @IsString()
  @Expose()
  cacheTag: string;
}
