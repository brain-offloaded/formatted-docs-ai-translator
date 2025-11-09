import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class BaseResponseDto {
  @ApiProperty({
    description: '요청이 성공했는지 여부',
    example: true,
  })
  @IsBoolean()
  @Expose()
  success: boolean;

  @ApiProperty({
    description: '요청 처리 결과 메시지',
    example: '처리가 완료되었습니다.',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Expose()
  message?: string;
}
