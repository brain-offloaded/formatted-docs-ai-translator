import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

import { TranslationExampleMatrix } from '@apps/common/dist/types/translation-example.types';

export class CreateExamplePresetRequestDto {
  @ApiProperty({ description: '새 프리셋 이름', example: '나만의 프리셋' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '프리셋 설명',
    example: '이것은 나만의 프리셋입니다.',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  description: string | null;

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
    required: false,
  })
  @IsObject()
  @IsOptional()
  examples?: TranslationExampleMatrix;
}
