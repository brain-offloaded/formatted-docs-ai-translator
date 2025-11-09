import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class UpdateTranslationBodyDto {
  @ApiProperty({
    description: '수정할 번역 텍스트',
    example: '안녕하세요!',
  })
  @IsString()
  @MinLength(1)
  @Expose()
  target: string;
}
