import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class ExamplePresetExampleLineDto {
  @ApiProperty({
    description: '원문 예제 문장',
    example: '안녕하세요',
  })
  @IsString()
  @Expose()
  sourceText: string;

  @ApiProperty({
    description: '번역 예제 문장',
    example: 'Hello',
  })
  @IsString()
  @Expose()
  resultText: string;
}
