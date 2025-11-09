import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsString, ValidateNested } from 'class-validator';

export class ImportTranslationItemDto {
  @ApiProperty({
    description: '번역 ID',
    example: 15,
  })
  @IsInt()
  @Type(() => Number)
  @Expose()
  id: number;

  @ApiProperty({
    description: '원본 텍스트',
    example: 'Sample sentence',
  })
  @IsString()
  @Expose()
  source: string;

  @ApiProperty({
    description: '번역된 텍스트',
    example: '샘플 문장',
  })
  @IsString()
  @Expose()
  target: string;

  @ApiProperty({
    description: '연결할 캐시 태그',
    example: '일반',
  })
  @IsString()
  @Expose()
  cacheTag: string;
}

export class ImportTranslationsRequestDto {
  @ApiProperty({
    description: '가져올 번역 목록',
    type: () => [ImportTranslationItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportTranslationItemDto)
  @Expose()
  translations: ImportTranslationItemDto[];
}
