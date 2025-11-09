import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';
import { ExamplePresetDetailDto } from '@/nest/translation/example/dto/example-preset-detail.dto';

export class GetExamplePresetDetailResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '예제 프리셋 상세 정보',
    type: () => ExamplePresetDetailDto,
  })
  @ValidateNested()
  @Type(() => ExamplePresetDetailDto)
  @Expose()
  preset: ExamplePresetDetailDto;
}
