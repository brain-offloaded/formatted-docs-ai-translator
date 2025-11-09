import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class GetPromptPresetDetailRequestDto {
  @ApiProperty({ description: '프롬프트 프리셋 ID', example: 1 })
  @IsNotEmpty()
  @IsInt()
  id: number;
}
