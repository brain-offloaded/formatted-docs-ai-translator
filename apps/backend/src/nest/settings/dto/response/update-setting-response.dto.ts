import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';

import { AppSettingDto } from './app-setting.dto';

export class UpdateSettingResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '저장된 설정 정보',
    type: () => AppSettingDto,
  })
  @ValidateNested()
  @Type(() => AppSettingDto)
  @Expose()
  result: AppSettingDto;
}
