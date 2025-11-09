import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class ExamplePresetIdParamDto {
  @ApiProperty({ description: '프리셋 ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  id: number;
}
