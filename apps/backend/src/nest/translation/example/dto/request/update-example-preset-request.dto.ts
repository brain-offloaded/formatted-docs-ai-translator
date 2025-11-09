import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

import { TranslationExampleMatrix } from '@apps/common/dist/types/translation-example.types';

export class UpdateExamplePresetRequestDto {
  @ApiProperty({
    description: '언어별 번역 예제 목록',
    example: {
      Korean: {
        English: {
          sourceLines: ['안녕하세요'],
          resultLines: ['Hello'],
        },
      },
    },
  })
  @IsObject()
  examples: TranslationExampleMatrix;

  @ApiProperty({
    description: '프리셋 설명',
    example: '이것은 업데이트된 프리셋입니다.',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiProperty({
    description: '프리셋 이름',
    example: '업데이트된 프리셋',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;
}
