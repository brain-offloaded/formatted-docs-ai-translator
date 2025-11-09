import { ApiProperty } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';
import { PromptPresetDto } from '../prompt-preset.dto';

export class UpdatePromptPresetResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '업데이트된 프롬프트 프리셋',
    type: PromptPresetDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PromptPresetDto)
  @Expose()
  preset?: PromptPresetDto;
}
