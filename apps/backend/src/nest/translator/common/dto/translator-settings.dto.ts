import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsIn,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { SourceLanguage, TargetLanguage } from '@apps/common/dist/language';

export enum ModelProvider {
  GOOGLE = 'Google',
  VERTEX_AI = 'vertex-ai',
  OPENAI_COMPATIBLE = 'openai-compatible',
}

export class TranslatorModelConfigDto {
  @ApiProperty({
    description: '번역 모델 이름',
    example: 'gpt-4o-mini',
  })
  @IsString()
  @IsNotEmpty()
  modelName: string;

  @ApiProperty({
    description: '분당 허용 요청 수',
    example: 60,
  })
  @IsNumber()
  @Min(0)
  requestsPerMinute: number;

  @ApiProperty({
    description: '출력 토큰의 최대 개수',
    example: 4096,
  })
  @IsNumber()
  @Min(0)
  maxOutputTokenCount: number;

  @ApiProperty({
    description: '동시에 처리할 최대 요청 수',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  maxConcurrentRequests: number;
}

export class TranslatorAiSettingsDto {
  @ApiProperty({
    description: '사용할 AI 모델 제공자',
    enum: ModelProvider,
    example: ModelProvider.GOOGLE,
  })
  @IsEnum(ModelProvider)
  modelProvider: ModelProvider;

  @ApiProperty({
    description: '원본 언어',
    enum: SourceLanguage,
    example: SourceLanguage.ENGLISH,
  })
  @IsEnum(SourceLanguage)
  sourceLanguage: SourceLanguage;

  @ApiProperty({
    description: '번역 대상 언어',
    enum: TargetLanguage,
    example: TargetLanguage.KOREAN,
  })
  @IsEnum(TargetLanguage)
  targetLanguage: TargetLanguage;

  @ApiProperty({
    description: 'AI 제공자에 전달할 API 키 (공백으로 구분된 복수 키 허용)',
    example: 'key-1 key-2 key-3',
  })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiProperty({
    description: 'OpenAI-compatible 제공자의 Base URL',
    example: 'http://localhost:8001/v1',
    required: false,
  })
  @ValidateIf((dto) => dto.modelProvider === ModelProvider.OPENAI_COMPATIBLE)
  @IsNotEmpty()
  @IsString()
  baseUrl?: string;

  @ApiProperty({
    description: 'AI 모델 동작에 필요한 설정',
    type: () => TranslatorModelConfigDto,
  })
  @ValidateNested()
  @Type(() => TranslatorModelConfigDto)
  customModelConfig: TranslatorModelConfigDto;

  @ApiProperty({
    description: '모델의 생각(Reasoning) 모드를 사용할지 여부',
    example: false,
  })
  @IsBoolean()
  useThinking: boolean;

  @ApiProperty({
    description: '모델의 생각(Reasoning) 강도',
    example: 'low',
    required: false,
  })
  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  @IsString()
  thinkingLevel?: string;

  @ApiProperty({
    description: '커스텀 생각 예산을 구성할지 여부',
    example: false,
  })
  @IsBoolean()
  setThinkingBudget: boolean;

  @ApiProperty({
    description: '생각 모드 활성화 시 사용하는 토큰 예산',
    example: 1024,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  thinkingBudget?: number;
}

export type TranslatorAiSettings = TranslatorAiSettingsDto;
