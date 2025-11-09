import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class SettingKeyParamDto {
  @ApiProperty({
    description: '설정을 조회하거나 수정할 때 사용하는 키',
    example: 'uiLanguage',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  key: string;
}
