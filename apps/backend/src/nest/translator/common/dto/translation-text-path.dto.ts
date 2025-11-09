import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class TranslationTextPathDto {
  @ApiProperty({
    description: '번역 대상 텍스트',
    example: 'こんにちは',
  })
  @IsString()
  @Expose()
  text: string;

  @ApiProperty({
    description: '텍스트를 식별하기 위한 경로 또는 키',
    example: 'document.sections[0].paragraphs[3]',
  })
  @IsString()
  @Expose()
  path: string;

  @ApiProperty({
    description: '추가 메타데이터',
    required: false,
    type: Object,
  })
  @IsOptional()
  @IsObject()
  @Expose()
  extra?: Record<string, unknown>;
}

export class TranslatedTextPathDto extends TranslationTextPathDto {
  @ApiProperty({
    description: '번역 결과 텍스트',
    example: '안녕하세요',
  })
  @IsString()
  @Expose()
  translatedText: string;
}
