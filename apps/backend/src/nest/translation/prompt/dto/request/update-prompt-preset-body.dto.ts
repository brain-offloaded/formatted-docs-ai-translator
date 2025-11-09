import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PromptPresetType } from '@/nest/translation/prompt/types/prompt-preset';

export class UpdatePromptPresetBodyDto {
  @ApiProperty({
    description: '프롬프트 프리셋 이름',
    example: '수정된 프롬프트',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '프롬프트 내용',
    example: '당신은 번역 전문가입니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiProperty({
    description: '프롬프트 프리셋 타입',
    enum: PromptPresetType,
    example: PromptPresetType.TEXT,
    required: false,
  })
  @IsOptional()
  @IsEnum(PromptPresetType)
  type?: PromptPresetType;
}
