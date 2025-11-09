import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class TranslationIdParamDto {
  @ApiProperty({
    description: '대상 번역 ID',
    example: 12,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Expose()
  translationId: number;
}
