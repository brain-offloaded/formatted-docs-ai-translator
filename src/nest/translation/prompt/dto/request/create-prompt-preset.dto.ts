import { IsNotEmpty, IsString } from 'class-validator'; // DTO 유효성 검사를 위해 추가

export class CreatePromptPresetRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  prompt: string;
}
