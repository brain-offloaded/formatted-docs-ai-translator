import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class UpdateTranslationRequestDto {
  @IsInt()
  id: number;

  @IsString()
  @IsNotEmpty()
  target: string;
}
