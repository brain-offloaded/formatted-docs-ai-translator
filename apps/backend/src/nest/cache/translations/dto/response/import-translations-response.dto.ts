import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ImportTranslationsResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '업데이트되거나 생성된 번역 수',
    example: 25,
  })
  @IsInt()
  @Min(0)
  @Expose()
  updatedCount: number;
}
