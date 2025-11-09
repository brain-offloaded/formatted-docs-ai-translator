import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';

import { PromptPreset as PromptPresetEntity } from '@prisma/client';
import { PromptPresetType } from '@/nest/translation/prompt/types/prompt-preset';

export { PromptPresetType };

export class PromptPresetDto {
  @ApiProperty({ description: '프롬프트 프리셋 ID', example: 1 })
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty({ description: '프롬프트 프리셋 이름', example: '기본 프롬프트' })
  @IsString()
  @Expose()
  name: string;

  @ApiProperty({
    description: '프롬프트 프리셋 타입',
    enum: PromptPresetType,
    example: PromptPresetType.TEXT,
  })
  @IsEnum(PromptPresetType)
  @Expose()
  type: PromptPresetType;

  static fromEntity(entity: PromptPresetEntity): PromptPresetDto {
    const dto = new PromptPresetDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.type = entity.type;
    return dto;
  }
}
