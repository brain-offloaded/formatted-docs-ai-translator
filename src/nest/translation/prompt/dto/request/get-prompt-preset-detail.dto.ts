import { IsInt, IsNotEmpty } from 'class-validator';

export class GetPromptPresetDetailRequestDto {
  @IsNotEmpty()
  @IsInt()
  id: number;
}
