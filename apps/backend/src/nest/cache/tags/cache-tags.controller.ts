import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { ICacheManagerService } from '@/nest/cache/cache-manager/services/i-cache-manager-service';
import { LoggerService } from '@/nest/logger/logger.service';
import type { CacheTagDeletionOptions } from '@apps/common/dist/types/cache';
import type { CacheTagQueryOptions } from '@/nest/cache/cache-manager/db-cache-manager/services/i-db-cache-manager-service';
import { errorToString } from '@/nest/utils/error-stringify';

import {
  GetCacheTagsQueryDto,
  CacheTagSortBy,
  SortOrder,
} from './dto/request/get-cache-tags-query.dto';
import { GetCacheTagsResponseDto } from './dto/response/get-cache-tags-response.dto';
import { CacheTagSummaryDto } from './dto/cache-tag-summary.dto';
import { CacheTagIdParamDto } from './dto/request/cache-tag-id-param.dto';
import {
  CacheTagDeletionModeDto,
  DeleteCacheTagBodyDto,
} from './dto/request/delete-cache-tag-body.dto';
import { DeleteCacheTagResponseDto } from './dto/response/delete-cache-tag-response.dto';

@ApiTags('cache-tags')
@Controller('cache/tags')
export class CacheTagsController {
  constructor(
    @Inject(ICacheManagerService)
    private readonly cacheManagerService: ICacheManagerService,
    private readonly logger: LoggerService
  ) {}

  @Get()
  @ApiOkResponse({
    description: '캐시 태그 목록을 조회합니다.',
    type: GetCacheTagsResponseDto,
  })
  @SerializeOptions({ type: GetCacheTagsResponseDto })
  async getCacheTags(@Query() query: GetCacheTagsQueryDto): Promise<GetCacheTagsResponseDto> {
    const options = this.toQueryOptions(query);
    try {
      const cacheTags = await this.cacheManagerService.getCacheTags(options);
      return {
        success: true,
        message: '캐시 태그 목록을 조회했습니다.',
        cacheTags: plainToInstance(CacheTagSummaryDto, cacheTags, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      const message = errorToString(error);
      this.logger.error('캐시 태그 조회 실패', { query: options, error: message });
      return { success: false, message, cacheTags: [] };
    }
  }

  @Delete(':id')
  @ApiOkResponse({
    description: '캐시 태그를 삭제합니다.',
    type: DeleteCacheTagResponseDto,
  })
  @SerializeOptions({ type: DeleteCacheTagResponseDto })
  async deleteCacheTag(
    @Param() { id }: CacheTagIdParamDto,
    @Body() body: DeleteCacheTagBodyDto
  ): Promise<DeleteCacheTagResponseDto> {
    const mode = body.mode ?? CacheTagDeletionModeDto.STRICT;
    const options: CacheTagDeletionOptions = {
      mode,
      targetTagId: body.targetTagId,
    };

    try {
      await this.cacheManagerService.deleteCacheTag(id, options);
      return { success: true, message: '캐시 태그를 삭제했습니다.' };
    } catch (error) {
      const message = errorToString(error);
      this.logger.error('캐시 태그 삭제 실패', { id, options, error: message });
      return { success: false, message };
    }
  }

  private toQueryOptions(query: GetCacheTagsQueryDto): CacheTagQueryOptions | undefined {
    if (!query.keyword && !query.sortBy && !query.sortOrder) {
      return undefined;
    }

    return {
      keyword: query.keyword,
      sortBy: query.sortBy ?? CacheTagSortBy.LAST_USED_AT,
      sortOrder: query.sortOrder ?? SortOrder.DESC,
    };
  }
}
