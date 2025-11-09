import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';

export class GetSettingResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '해당 키에 저장된 설정 값',
    example: 'ko',
    required: false,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @Expose()
  result: string | null;
}
