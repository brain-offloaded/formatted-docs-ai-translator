import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { PromptPresetType } from '@/nest/translation/prompt/types/prompt-preset';

export class GetPromptPresetsRequestDto {
  @ApiProperty({
    description: '프롬프트 프리셋 타입 필터',
    enum: PromptPresetType,
    required: false,
    example: PromptPresetType.TEXT,
  })
  @IsOptional()
  @IsEnum(PromptPresetType)
  type?: PromptPresetType;
}
