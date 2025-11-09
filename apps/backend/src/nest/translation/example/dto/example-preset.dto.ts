import { TargetLanguage } from '@apps/common/dist/language';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class ExamplePresetDto {
  @ApiProperty({ description: '프리셋 ID', example: 1 })
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty({ description: '프리셋 이름', example: '기본 프리셋' })
  @IsString()
  @Expose()
  name: string;

  @ApiProperty({
    description: '프리셋 설명',
    example: '이것은 기본 프리셋입니다.',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Expose()
  description: string | null;

  @ApiProperty({
    description: '프리셋에 포함된 언어 목록',
    example: [TargetLanguage.KOREAN, TargetLanguage.ENGLISH],
  })
  @IsArray()
  @IsEnum(TargetLanguage, { each: true })
  @Expose()
  languages: TargetLanguage[];
}
