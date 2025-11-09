import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

export class TranslationExportImportDto {
  @ApiProperty({
    description: '번역 ID',
    example: 101,
  })
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty({
    description: '원본 텍스트',
    example: 'How are you?',
  })
  @IsString()
  @Expose()
  source: string;

  @ApiProperty({
    description: '번역 텍스트',
    example: '잘 지내?',
  })
  @IsString()
  @Expose()
  target: string;

  @ApiProperty({
    description: '연결된 캐시 태그',
    example: '일반',
  })
  @IsString()
  @Expose()
  cacheTag: string;
}
