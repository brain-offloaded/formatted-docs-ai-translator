import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator'; // DTO 유효성 검사를 위해 추가

export class UpdatePromptPresetRequestDto {
  @IsNotEmpty()
  @IsInt()
  id: number;

  @IsOptional() // 이름은 선택적으로 변경 가능
  @IsString()
  name?: string;

  @IsOptional() // 프롬프트는 선택적으로 변경 가능
  @IsString()
  prompt?: string;
}
