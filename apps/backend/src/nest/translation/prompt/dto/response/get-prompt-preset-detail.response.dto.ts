import { ApiProperty } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';
import { PromptPresetDetailDto } from '../prompt-preset-detail.dto';

export class GetPromptPresetDetailResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '프롬프트 프리셋 상세 정보',
    type: PromptPresetDetailDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PromptPresetDetailDto)
  @Expose()
  preset?: PromptPresetDetailDto;
}
