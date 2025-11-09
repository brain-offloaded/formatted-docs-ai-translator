import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoadExamplePresetRequestDto {
  @ApiProperty({ description: '로드할 프리셋 이름', example: '기본 프리셋' })
  @IsString()
  name: string;
}
