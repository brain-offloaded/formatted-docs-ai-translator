import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { TranslationHistoryDto } from '../translation-history.dto';

export class GetTranslationHistoryResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '선택한 번역의 이력 목록',
    type: () => [TranslationHistoryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationHistoryDto)
  @Expose()
  translationHistory: TranslationHistoryDto[];
}
