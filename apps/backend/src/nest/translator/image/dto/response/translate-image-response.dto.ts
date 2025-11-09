import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';

export class ImageTextBoundingBoxDto {
  @ApiProperty({
    description: '번역 대상 텍스트',
    example: 'Hello world',
  })
  @IsString()
  @Expose()
  text: string;

  @ApiProperty({
    description: '이미지 내 텍스트의 위치를 나타내는 [y1, x1, y2, x2] 좌표',
    type: Number,
    isArray: true,
    minItems: 4,
    maxItems: 4,
    example: [100, 120, 220, 360],
  })
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsNumber({}, { each: true })
  @Expose()
  box_2d: [number, number, number, number];
}

export class ImageOcrTranslationResultDto {
  @ApiProperty({
    description: 'OCR 결과 목록',
    type: () => [ImageTextBoundingBoxDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ImageTextBoundingBoxDto)
  @Expose()
  ocr_result: ImageTextBoundingBoxDto[];

  @ApiProperty({
    description: '번역된 텍스트 목록',
    type: () => [ImageTextBoundingBoxDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ImageTextBoundingBoxDto)
  @Expose()
  translated_result: ImageTextBoundingBoxDto[];
}

export class TranslateImageResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: '이미지 번역 결과',
    type: () => ImageOcrTranslationResultDto,
  })
  @ValidateNested()
  @Type(() => ImageOcrTranslationResultDto)
  @Expose()
  result: ImageOcrTranslationResultDto;
}
