import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';

import { PromptPresetType } from '@/nest/translation/prompt/types/prompt-preset';

export class PromptPresetDetailDto {
  @ApiProperty({ description: '프롬프트 프리셋 ID', example: 1 })
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty({ description: '프롬프트 프리셋 이름', example: '기본 프롬프트' })
  @IsString()
  @Expose()
  name: string;

  @ApiProperty({ description: '프롬프트 내용', example: '당신은 번역 전문가입니다.' })
  @IsString()
  @Expose()
  prompt: string;

  @ApiProperty({
    description: '프롬프트 프리셋 타입',
    enum: PromptPresetType,
    example: PromptPresetType.TEXT,
  })
  @IsEnum(PromptPresetType)
  @Expose()
  type: PromptPresetType;
}
