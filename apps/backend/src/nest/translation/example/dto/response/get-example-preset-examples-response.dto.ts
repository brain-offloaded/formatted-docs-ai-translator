import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, ValidateNested } from 'class-validator';

import { TargetLanguage } from '@apps/common/dist/language';
import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';
import { ExamplePresetExampleLineDto } from '../example-preset-example-line.dto';

export class GetExamplePresetExamplesResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '예제를 조회한 소스 언어',
    enum: TargetLanguage,
  })
  @IsEnum(TargetLanguage)
  @Expose()
  sourceLanguage: TargetLanguage;

  @ApiProperty({
    description: '예제를 조회한 타겟 언어',
    enum: TargetLanguage,
  })
  @IsEnum(TargetLanguage)
  @Expose()
  targetLanguage: TargetLanguage;

  @ApiProperty({
    description: '요청한 언어 쌍에 해당하는 예제 문장 목록',
    type: () => [ExamplePresetExampleLineDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ExamplePresetExampleLineDto)
  @Expose()
  examples: ExamplePresetExampleLineDto[];
}
