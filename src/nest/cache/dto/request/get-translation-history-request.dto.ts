import { IsInt } from 'class-validator';

export class GetTranslationHistoryRequestDto {
  @IsInt()
  translationId: number;
}
