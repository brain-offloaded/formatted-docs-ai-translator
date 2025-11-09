import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { TranslatorAiSettingsDto } from '@/nest/translator/common/dto/translator-settings.dto';

export class TranslateImageRequestDto {
  @ApiProperty({
    description: 'Base64로 인코딩된 원본 이미지 데이터',
    example: 'iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @IsString()
  @IsNotEmpty()
  base64: string;

  @ApiProperty({
    description: '원본 이미지 파일 경로',
    example: '/Users/john/Desktop/example.png',
    required: false,
  })
  @IsString()
  @IsOptional()
  sourceFilePath?: string;

  @ApiProperty({
    description: '이미지 번역에 사용할 프롬프트 프리셋 내용',
    example: '이 이미지를 한국어로 번역해 주세요.',
    required: false,
  })
  @IsString()
  @IsOptional()
  promptPresetContent?: string;

  @ApiProperty({
    description: '번역 결과를 저장할 캐시 태그',
    example: 'default',
    required: false,
  })
  @IsString()
  @IsOptional()
  cacheTag?: string;

  @ApiProperty({
    description: '번역 요청을 구분하기 위한 고유 ID',
    example: 'a3e6c6b4-2b80-4f5c-b75d-0e1d1f487af6',
  })
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @ApiProperty({
    description: 'AI 번역기에 전달할 설정 값',
    type: () => TranslatorAiSettingsDto,
  })
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => TranslatorAiSettingsDto)
  aiSettings: TranslatorAiSettingsDto;
}
