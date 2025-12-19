import { ApiProperty } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';
import { ModelPresetDto } from '../model-preset.dto';

export class GetModelPresetsResponseDto extends BaseResponseDto {
  @ApiProperty({ description: '모델 프리셋 목록', type: [ModelPresetDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModelPresetDto)
  @Expose()
  presets: ModelPresetDto[];
}
