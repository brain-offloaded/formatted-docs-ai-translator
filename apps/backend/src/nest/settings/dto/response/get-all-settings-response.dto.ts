import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';

import { AppSettingDto } from './app-setting.dto';

export class GetAllSettingsResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '저장된 모든 설정 목록',
    type: () => [AppSettingDto],
  })
  @ValidateNested({ each: true })
  @Type(() => AppSettingDto)
  @Expose()
  result: AppSettingDto[];
}
