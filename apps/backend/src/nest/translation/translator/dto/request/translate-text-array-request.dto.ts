import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { TranslatorAiSettingsDto } from '@/nest/translator/common/dto/translator-settings.dto';
import { TranslationTextPathDto } from '@/nest/translator/common/dto/translation-text-path.dto';
import { PlaceholderPreservationSettingsDto } from './placeholder-preservation.dto';

export class TranslateTextArrayRequestDto {
  @ApiProperty({
    description: '번역 요청 식별자',
    example: '9c3e6de9-33c2-4a3f-a5e1-4a03bddf10cf',
  })
  @IsUUID()
  requestId: string;

  @ApiProperty({
    description: 'AI 번역기에 전달할 설정 값',
    type: () => TranslatorAiSettingsDto,
  })
  @ValidateNested()
  @Type(() => TranslatorAiSettingsDto)
  aiSettings: TranslatorAiSettingsDto;

  @ApiProperty({
    description: '번역 대상 텍스트 배열',
    type: () => [TranslationTextPathDto],
  })
  @ValidateNested({ each: true })
  @Type(() => TranslationTextPathDto)
  textPaths: TranslationTextPathDto[];

  @ApiProperty({
    description: '번역 대상 원본 파일 경로',
    example: '/Users/john/Documents/example.json',
    required: false,
  })
  @IsOptional()
  @IsString()
  sourceFilePath?: string;

  @ApiProperty({
    description: '프롬프트 프리셋 내용',
    example: '번역 시 존댓말을 사용해 주세요.',
    required: false,
  })
  @IsOptional()
  @IsString()
  promptPresetContent?: string;

  @ApiProperty({
    description: '번역 결과를 저장할 캐시 태그',
    example: 'default',
  })
  @IsString()
  @IsNotEmpty()
  cacheTag: string;

  @ApiProperty({
    description: '플레이스홀더 보존 검사 설정(텍스트/파일 번역에만 적용)',
    type: () => PlaceholderPreservationSettingsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlaceholderPreservationSettingsDto)
  placeholderPreservation?: PlaceholderPreservationSettingsDto;
}
