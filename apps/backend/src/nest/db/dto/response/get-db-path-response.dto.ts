import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

import { BaseResponseDto } from '@apps/common/dist/dto/base-response.dto';

export class GetDbPathResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'The path to the database file.',
    example: '/path/to/database.db',
  })
  @IsString()
  @Expose()
  path: string;
}
