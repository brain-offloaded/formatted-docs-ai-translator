import { ApiProperty } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';
import { ModelPresetDto } from '../model-preset.dto';

export class CreateModelPresetResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '생성된 모델 프리셋 정보',
    type: ModelPresetDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ModelPresetDto)
  @Expose()
  preset?: ModelPresetDto;
}
