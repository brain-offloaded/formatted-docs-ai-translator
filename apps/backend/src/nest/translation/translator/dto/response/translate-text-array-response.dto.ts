import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';
import { TranslatedTextPathDto } from '@/nest/translator/common/dto/translation-text-path.dto';

export class TranslateTextArrayResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '번역 결과 텍스트 경로 목록',
    type: () => [TranslatedTextPathDto],
  })
  @ValidateNested({ each: true })
  @Type(() => TranslatedTextPathDto)
  @Expose()
  translatedTextPaths: TranslatedTextPathDto[];
}
