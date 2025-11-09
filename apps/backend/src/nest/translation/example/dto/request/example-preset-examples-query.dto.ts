import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum } from 'class-validator';

import { TargetLanguage } from '@apps/common/dist/language';

export class ExamplePresetExamplesQueryDto {
  @ApiProperty({
    description: '예제를 조회할 소스 언어',
    enum: TargetLanguage,
  })
  @IsEnum(TargetLanguage)
  @Expose()
  sourceLanguage: TargetLanguage;

  @ApiProperty({
    description: '예제를 조회할 타겟 언어',
    enum: TargetLanguage,
  })
  @IsEnum(TargetLanguage)
  @Expose()
  targetLanguage: TargetLanguage;
}
