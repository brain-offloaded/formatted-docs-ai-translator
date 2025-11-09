import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsDateString, IsString } from 'class-validator';

export class AppSettingDto {
  @ApiProperty({
    description: '설정 키',
    example: 'uiLanguage',
  })
  @IsString()
  @Expose()
  key: string;

  @ApiProperty({
    description: '설정 값',
    example: 'ko',
  })
  @IsString()
  @Expose()
  value: string;

  @ApiProperty({
    description: '설정이 생성된 시각',
    example: '2024-04-01T12:34:56.000Z',
    format: 'date-time',
  })
  @IsDateString()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  @Expose()
  createdAt: string;

  @ApiProperty({
    description: '설정이 마지막으로 업데이트된 시각',
    example: '2024-04-03T08:15:30.000Z',
    format: 'date-time',
  })
  @IsDateString()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  @Expose()
  updatedAt: string;
}
