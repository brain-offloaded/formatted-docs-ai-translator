import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { TranslatorModelPreset as TranslatorModelPresetEntity } from '@prisma/client';
import { ModelProvider } from '@/nest/translator/common/dto/translator-settings.dto';

export class ModelPresetDto {
  @ApiProperty({ description: '모델 프리셋 ID', example: 1 })
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty({ description: '모델 프리셋 이름', example: '로컬 vLLM 기본값' })
  @IsString()
  @Expose()
  name: string;

  @ApiProperty({
    description: 'AI 모델 제공자',
    enum: ModelProvider,
    example: ModelProvider.OPENAI_COMPATIBLE,
  })
  @IsEnum(ModelProvider)
  @Expose()
  modelProvider: ModelProvider;

  @ApiProperty({
    description: 'OpenAI-compatible 제공자의 Base URL',
    example: 'http://localhost:8001/v1',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Expose()
  baseUrl?: string;

  @ApiProperty({
    description: 'AI 제공자에 전달할 API 키 (공백으로 구분된 복수 키 허용)',
    example: 'key-1 key-2 key-3',
  })
  @IsString()
  @Expose()
  apiKey: string;

  @ApiProperty({ description: '번역 모델 이름', example: 'gpt-4o-mini' })
  @IsString()
  @Expose()
  modelName: string;

  @ApiProperty({ description: '분당 허용 요청 수', example: 60 })
  @IsNumber()
  @Expose()
  requestsPerMinute: number;

  @ApiProperty({ description: '출력 토큰의 최대 개수', example: 4096 })
  @IsNumber()
  @Expose()
  maxOutputTokenCount: number;

  @ApiProperty({ description: '동시에 처리할 최대 요청 수', example: 2 })
  @IsNumber()
  @Expose()
  maxConcurrentRequests: number;

  @ApiProperty({ description: '모델의 생각(Reasoning) 모드를 사용할지 여부', example: false })
  @IsBoolean()
  @Expose()
  useThinking: boolean;

  @ApiProperty({ description: '커스텀 생각 예산을 구성할지 여부', example: false })
  @IsBoolean()
  @Expose()
  setThinkingBudget: boolean;

  @ApiProperty({
    description: '생각 모드 활성화 시 사용하는 토큰 예산',
    example: 1024,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Expose()
  thinkingBudget?: number;

  static fromEntity(entity: TranslatorModelPresetEntity): ModelPresetDto {
    const dto = new ModelPresetDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.modelProvider = entity.modelProvider as ModelProvider;
    dto.baseUrl = entity.baseUrl ?? undefined;
    dto.apiKey = entity.apiKey;
    dto.modelName = entity.modelName;
    dto.requestsPerMinute = entity.requestsPerMinute;
    dto.maxOutputTokenCount = entity.maxOutputTokenCount;
    dto.maxConcurrentRequests = entity.maxConcurrentRequests;
    dto.useThinking = entity.useThinking;
    dto.setThinkingBudget = entity.setThinkingBudget;
    dto.thinkingBudget = entity.thinkingBudget ?? undefined;
    return dto;
  }
}
