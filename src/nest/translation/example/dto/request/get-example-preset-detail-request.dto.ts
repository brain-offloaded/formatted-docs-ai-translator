import { IsInt, IsNotEmpty } from 'class-validator'; // 유효성 검사 추가

export class GetExamplePresetDetailRequestDto {
  @IsNotEmpty()
  @IsInt()
  id: number; // name 대신 id 사용
}
