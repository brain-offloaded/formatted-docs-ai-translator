import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PlaceholderPreservationRuleDto {
  @ApiProperty({
    description: '플레이스홀더 정규식 패턴 (슬래시 `/.../` 없이 패턴만)',
    example: '\\\\n',
  })
  @IsString()
  @IsNotEmpty()
  pattern: string;

  @ApiProperty({
    description: '정규식 플래그 문자열 (예: i, imsu). g는 내부적으로 적용됩니다.',
    example: 'imsu',
    required: false,
  })
  @IsString()
  @IsOptional()
  flags?: string;
}

export class PlaceholderPreservationSettingsDto {
  @ApiProperty({
    description: '플레이스홀더 보존 검사 활성화 여부',
    example: true,
  })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    description: '플레이스홀더 보존 검사 규칙 목록',
    type: () => [PlaceholderPreservationRuleDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaceholderPreservationRuleDto)
  @ArrayMaxSize(100)
  rules: PlaceholderPreservationRuleDto[];
}
