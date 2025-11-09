import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSettingRequestDto {
  @ApiProperty({
    description: '저장할 설정 값',
    example: 'ko',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  value: string;
}
