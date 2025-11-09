import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';
import { ExamplePresetDto } from '@/nest/translation/example/dto/example-preset.dto';

export class CreateExamplePresetResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '생성된 예제 프리셋 정보',
    type: () => ExamplePresetDto,
  })
  @ValidateNested()
  @Type(() => ExamplePresetDto)
  @Expose()
  preset: ExamplePresetDto;
}
