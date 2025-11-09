import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';
import { ExamplePresetDto } from '@/nest/translation/example/dto/example-preset.dto';

export class GetExamplePresetsResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '예제 프리셋 목록',
    type: () => [ExamplePresetDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamplePresetDto)
  @Expose()
  presets: ExamplePresetDto[];

  @ApiProperty({
    description: '현재 선택된 프리셋 이름',
    example: '기본 프리셋',
  })
  @IsString()
  @Expose()
  currentPreset: string;
}
