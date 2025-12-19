import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

import { ModelProvider } from '@/nest/translator/common/dto/translator-settings.dto';

export class CreateModelPresetRequestDto {
  @ApiProperty({ description: '모델 프리셋 이름', example: '로컬 vLLM 기본값' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: '사용할 AI 모델 제공자',
    enum: ModelProvider,
    example: ModelProvider.OPENAI_COMPATIBLE,
  })
  @IsEnum(ModelProvider)
  modelProvider: ModelProvider;

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
    description: 'AI 제공자에 전달할 API 키 (공백으로 구분된 복수 키 허용)',
    example: 'key-1 key-2 key-3',
  })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiProperty({ description: '번역 모델 이름', example: 'gpt-4o-mini' })
  @IsString()
  @IsNotEmpty()
  modelName: string;

  @ApiProperty({ description: '분당 허용 요청 수', example: 60 })
  @IsNumber()
  @Min(0)
  requestsPerMinute: number;

  @ApiProperty({ description: '출력 토큰의 최대 개수', example: 4096 })
  @IsNumber()
  @Min(0)
  maxOutputTokenCount: number;

  @ApiProperty({ description: '동시에 처리할 최대 요청 수', example: 2 })
  @IsNumber()
  @Min(1)
  maxConcurrentRequests: number;

  @ApiProperty({ description: '모델의 생각(Reasoning) 모드를 사용할지 여부', example: false })
  @IsBoolean()
  useThinking: boolean;

  @ApiProperty({ description: '커스텀 생각 예산을 구성할지 여부', example: false })
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
