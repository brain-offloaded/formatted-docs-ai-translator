import { Controller, Get, SerializeOptions } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { GetDbPathResponseDto } from './dto';
import { DbService } from './services/db.service';

@ApiTags('db')
@Controller('db')
export class DbController {
  constructor(private readonly dbService: DbService) {}

  @Get('path')
  @ApiOkResponse({
    description: 'Returns the path to the database file.',
    type: GetDbPathResponseDto,
  })
  @SerializeOptions({ type: GetDbPathResponseDto })
  getDbPath(): GetDbPathResponseDto {
    const path = this.dbService.getDbPath();
    return {
      path,
      success: true,
      message: '데이터베이스 경로 조회에 성공했습니다.',
    };
  }
}
