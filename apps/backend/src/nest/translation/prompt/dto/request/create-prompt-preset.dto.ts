import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { PromptPresetType } from '@/nest/translation/prompt/types/prompt-preset';

export class CreatePromptPresetRequestDto {
  @ApiProperty({ description: '프롬프트 프리셋 이름', example: '기본 프롬프트' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '프롬프트 내용', example: '당신은 번역 전문가입니다.' })
  @IsNotEmpty()
  @IsString()
  prompt: string;

  @ApiProperty({
    description: '프롬프트 프리셋 타입',
    enum: PromptPresetType,
    example: PromptPresetType.TEXT,
  })
  @IsNotEmpty()
  @IsEnum(PromptPresetType)
  type: PromptPresetType;
}
