import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { LoggerService } from './logger.service';
import { GetLogsQueryDto } from './dto/request/get-logs-query.dto';
import { LogIdParamDto } from './dto/request/log-id-param.dto';
import { DeleteLogsRequestDto } from './dto/request/delete-logs-request.dto';
import { GetLogsResponseDto } from './dto/response/get-logs-response.dto';
import { GetLogDetailResponseDto } from './dto/response/get-log-detail-response.dto';
import { DeleteLogsResponseDto } from './dto/response/delete-logs-response.dto';

@ApiTags('logs')
@Controller('logs')
export class LoggerController {
  constructor(private readonly loggerService: LoggerService) {}

  @Get()
  @ApiOkResponse({
    description: '로그 목록을 조회합니다.',
    type: GetLogsResponseDto,
  })
  @SerializeOptions({ type: GetLogsResponseDto })
  async getLogs(@Query() query: GetLogsQueryDto): Promise<GetLogsResponseDto> {
    const result = await this.loggerService.getLogs({
      page: query.page,
      itemsPerPage: query.itemsPerPage,
      levels: query.levels,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    return result;
  }

  @Get(':id')
  @ApiOkResponse({
    description: '특정 로그의 상세 정보를 조회합니다.',
    type: GetLogDetailResponseDto,
  })
  @SerializeOptions({ type: GetLogDetailResponseDto })
  async getLogDetail(@Param() { id }: LogIdParamDto): Promise<GetLogDetailResponseDto> {
    return this.loggerService.getLogDetail({ id });
  }

  @Delete()
  @ApiOkResponse({
    description: '선택한 로그 또는 조건에 맞는 로그를 삭제합니다.',
    type: DeleteLogsResponseDto,
  })
  @SerializeOptions({ type: DeleteLogsResponseDto })
  async deleteLogs(
    @Body() { logIds, searchParams }: DeleteLogsRequestDto
  ): Promise<DeleteLogsResponseDto> {
    if ((!logIds || logIds.length === 0) && !searchParams) {
      throw new BadRequestException('삭제할 로그 ID 또는 검색 조건을 제공해야 합니다.');
    }

    if (logIds?.length) {
      await this.loggerService.deleteLogs(logIds);
      return {
        success: true,
        message: '선택한 로그를 삭제했습니다.',
      };
    }

    await this.loggerService.deleteAllLogs(searchParams);

    return {
      success: true,
      message: '검색 조건에 해당하는 로그를 삭제했습니다.',
    };
  }
}
