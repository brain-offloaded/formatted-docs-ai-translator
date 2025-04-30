import { IsInt, IsNotEmpty } from 'class-validator'; // DTO 유효성 검사를 위해 추가

export class DeletePromptPresetRequestDto {
  @IsNotEmpty()
  @IsInt()
  id: number;
}
