import { ApiProperty } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';
import { PromptPresetDto } from '../prompt-preset.dto';

export class GetPromptPresetsResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '프롬프트 프리셋 목록',
    type: [PromptPresetDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromptPresetDto)
  @Expose()
  presets: PromptPresetDto[];
}
