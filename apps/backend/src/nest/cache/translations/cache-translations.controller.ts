import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { LoggerService } from '@/nest/logger/logger.service';
import { ICacheManagerService } from '@/nest/cache/cache-manager/services/i-cache-manager-service';
import type { CacheSearchParams } from '@apps/common/dist/types/common';
import { CacheSearchType } from '@apps/common/dist/types/common';
import { errorToString } from '@/nest/utils/error-stringify';

import { CacheTranslationDto } from './dto/cache-translation.dto';
import { GetCacheTranslationsQueryDto } from './dto/request/get-cache-translations-query.dto';
import { GetCacheTranslationsResponseDto } from './dto/response/get-cache-translations-response.dto';
import { TranslationIdParamDto } from './dto/request/translation-id-param.dto';
import { TranslationHistoryDto } from './dto/translation-history.dto';
import { GetTranslationHistoryResponseDto } from './dto/response/get-translation-history-response.dto';
import { UpdateTranslationBodyDto } from './dto/request/update-translation-body.dto';
import { UpdateTranslationResponseDto } from './dto/response/update-translation-response.dto';
import { UpdateTranslationCacheTagBodyDto } from './dto/request/update-translation-cache-tag-body.dto';
import { UpdateTranslationCacheTagResponseDto } from './dto/response/update-translation-cache-tag-response.dto';
import { DeleteCacheTranslationsRequestDto } from './dto/request/delete-cache-translations-request.dto';
import { DeleteCacheTranslationsResponseDto } from './dto/response/delete-cache-translations-response.dto';
import { ExportTranslationsResponseDto } from './dto/response/export-translations-response.dto';
import { TranslationExportImportDto } from './dto/translation-export-import.dto';
import { ImportTranslationsRequestDto } from './dto/request/import-translations-request.dto';
import { ImportTranslationsResponseDto } from './dto/response/import-translations-response.dto';
import { CacheTranslationsSearchParamsDto } from './dto/request/cache-translations-search-params.dto';

@ApiTags('cache-translations')
@Controller('cache/translations')
export class CacheTranslationsController {
  constructor(
    @Inject(ICacheManagerService)
    private readonly cacheManagerService: ICacheManagerService,
    private readonly logger: LoggerService
  ) {}

  @Get()
  @ApiOkResponse({
    description: '번역 캐시 목록을 조회합니다.',
    type: GetCacheTranslationsResponseDto,
  })
  @SerializeOptions({ type: GetCacheTranslationsResponseDto })
  async getTranslations(
    @Query() query: GetCacheTranslationsQueryDto
  ): Promise<GetCacheTranslationsResponseDto> {
    const { page, itemsPerPage, ...rest } = query;
    const { translations, totalItems } = await this.cacheManagerService.getTranslationsByConditions(
      page,
      itemsPerPage,
      this.buildSearchParams(rest)
    );

    return {
      success: true,
      message: '번역 목록을 조회했습니다.',
      translations: plainToInstance(CacheTranslationDto, translations, {
        excludeExtraneousValues: true,
      }),
      totalItems,
    };
  }

  @Get(':translationId/history')
  @ApiOkResponse({
    description: '선택한 번역의 이력을 조회합니다.',
    type: GetTranslationHistoryResponseDto,
  })
  @SerializeOptions({ type: GetTranslationHistoryResponseDto })
  async getTranslationHistory(
    @Param() { translationId }: TranslationIdParamDto
  ): Promise<GetTranslationHistoryResponseDto> {
    const history = await this.cacheManagerService.getTranslationHistoryById(translationId);
    return {
      success: true,
      message: '번역 이력을 조회했습니다.',
      translationHistory: plainToInstance(TranslationHistoryDto, history, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch(':translationId')
  @ApiOkResponse({
    description: '번역 결과를 수정합니다.',
    type: UpdateTranslationResponseDto,
  })
  @SerializeOptions({ type: UpdateTranslationResponseDto })
  async updateTranslation(
    @Param() { translationId }: TranslationIdParamDto,
    @Body() { target }: UpdateTranslationBodyDto
  ): Promise<UpdateTranslationResponseDto> {
    try {
      await this.cacheManagerService.updateTranslation(translationId, target);
      return { success: true, message: '번역이 업데이트되었습니다.' };
    } catch (error) {
      const message = errorToString(error);
      this.logger.error('번역 업데이트 실패', { translationId, error: message });
      return { success: false, message };
    }
  }

  @Patch(':translationId/cache-tag')
  @ApiOkResponse({
    description: '번역의 캐시 태그를 변경합니다.',
    type: UpdateTranslationCacheTagResponseDto,
  })
  @SerializeOptions({ type: UpdateTranslationCacheTagResponseDto })
  async updateTranslationCacheTag(
    @Param() { translationId }: TranslationIdParamDto,
    @Body() { cacheTagId }: UpdateTranslationCacheTagBodyDto
  ): Promise<UpdateTranslationCacheTagResponseDto> {
    try {
      await this.cacheManagerService.updateTranslationCacheTag(translationId, cacheTagId);
      return { success: true, message: '캐시 태그를 변경했습니다.' };
    } catch (error) {
      const message = errorToString(error);
      this.logger.error('캐시 태그 변경 실패', { translationId, cacheTagId, error: message });
      return { success: false, message };
    }
  }

  @Delete()
  @ApiOkResponse({
    description:
      '선택된 번역을 삭제하거나 검색 조건에 맞는 모든 번역을 삭제합니다. `translationIds` 또는 `searchParams` 중 하나는 필수입니다.',
    type: DeleteCacheTranslationsResponseDto,
  })
  @SerializeOptions({ type: DeleteCacheTranslationsResponseDto })
  async deleteTranslations(
    @Body() payload: DeleteCacheTranslationsRequestDto
  ): Promise<DeleteCacheTranslationsResponseDto> {
    const { translationIds, searchParams } = payload;
    try {
      if (translationIds?.length) {
        await this.cacheManagerService.deleteTranslations(translationIds);
        return { success: true, message: '선택한 번역을 삭제했습니다.' };
      }

      if (searchParams) {
        await this.cacheManagerService.deleteAllTranslations(this.buildSearchParams(searchParams));
        return { success: true, message: '검색 조건에 해당하는 번역을 모두 삭제했습니다.' };
      }

      throw new BadRequestException('삭제할 번역 ID 또는 검색 조건이 필요합니다.');
    } catch (error) {
      const message = errorToString(error);
      this.logger.error('번역 삭제 실패', { translationIds, searchParams, error: message });
      return { success: false, message };
    }
  }

  @Get('export')
  @ApiOkResponse({
    description: '검색 조건에 맞는 번역을 내보냅니다.',
    type: ExportTranslationsResponseDto,
  })
  @SerializeOptions({ type: ExportTranslationsResponseDto })
  async exportTranslations(
    @Query() query: CacheTranslationsSearchParamsDto
  ): Promise<ExportTranslationsResponseDto> {
    try {
      const translations = await this.cacheManagerService.exportTranslations(
        this.buildSearchParams(query)
      );

      return {
        success: true,
        message: '번역을 내보냈습니다.',
        translations: plainToInstance(TranslationExportImportDto, translations, {
          excludeExtraneousValues: true,
        }),
      };
    } catch (error) {
      const message = errorToString(error);
      this.logger.error('번역 내보내기 실패', { query, error: message });
      return { success: false, message, translations: [] };
    }
  }

  @Post('import')
  @ApiOkResponse({
    description: '번역을 가져옵니다.',
    type: ImportTranslationsResponseDto,
  })
  @SerializeOptions({ type: ImportTranslationsResponseDto })
  async importTranslations(
    @Body() { translations }: ImportTranslationsRequestDto
  ): Promise<ImportTranslationsResponseDto> {
    try {
      const updatedCount = await this.cacheManagerService.importTranslations(translations);
      return {
        success: true,
        message: `${updatedCount}개의 번역을 가져왔습니다.`,
        updatedCount,
      };
    } catch (error) {
      const message = errorToString(error);
      this.logger.error('번역 가져오기 실패', { error: message });
      return { success: false, message, updatedCount: 0 };
    }
  }

  private buildSearchParams(source?: Partial<CacheTranslationsSearchParamsDto>): CacheSearchParams {
    return {
      searchType: source?.searchType ?? CacheSearchType.SOURCE,
      searchValue: source?.searchValue ?? '',
      startDate: source?.startDate ?? '',
      endDate: source?.endDate ?? '',
    };
  }
}
