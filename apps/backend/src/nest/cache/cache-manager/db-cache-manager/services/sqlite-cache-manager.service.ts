import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { TranslationLoaderService } from '../../../../cache/loader/translation-loader/translation-loader.service';
import { PrismaService } from '@/nest/db/prisma/prisma.service';
import { LoggerService } from '../../../../logger/logger.service';
import {
  TranslationHistory,
  TranslationData,
  CacheTranslation,
  TranslationBasicInfo,
  CacheTagSummary,
  CacheTagDeletionOptions,
} from '@apps/common/dist/types/cache';
import { CacheSearchParams, CacheSearchType } from '@apps/common/dist/types/common';
import { DEFAULT_CACHE_TAG } from '@apps/common/dist/constants/cache';

import { CacheTagQueryOptions, IDbCacheManagerService } from './i-db-cache-manager-service';
import type { TransactionContext } from '@/nest/common/transaction/unit-of-work.service';

type TranslationWithCacheTag = Prisma.TranslationGetPayload<{ include: { cacheTag: true } }>;

@Injectable()
export class SqliteCacheManagerService implements IDbCacheManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly translationLoader: TranslationLoaderService,
    private readonly logger: LoggerService
  ) {}

  async getTranslation(text: string, cacheTag: string = DEFAULT_CACHE_TAG): Promise<string | null> {
    try {
      const translation = await this.translationLoader.loadBySource(text, cacheTag);
      return translation?.target || null;
    } catch (error) {
      this.logger.error('번역 캐시 조회 중 오류:', { error });
      return null;
    }
  }

  async setTranslation(
    text: string,
    translation: string,
    success: boolean = true,
    modelName: string = 'unknown',
    cacheTag: string = DEFAULT_CACHE_TAG,
    error?: string
  ): Promise<void> {
    try {
      await this.translationLoader.saveTranslation(
        text,
        translation,
        success,
        modelName,
        cacheTag,
        error
      );
    } catch (error) {
      this.logger.error('번역 캐시 저장 중 오류:', { error });
    }
  }

  async addTranslationHistory(history: TranslationHistory): Promise<void> {
    try {
      await this.translationLoader.saveTranslation(
        history.source,
        history.target,
        history.success,
        history.model,
        history.cacheTag || DEFAULT_CACHE_TAG,
        history.error || null
      );
    } catch (error) {
      this.logger.error('번역 이력 저장 중 오류:', { error });
    }
  }

  async getTranslationHistory(source: string, cacheTag: string): Promise<TranslationHistory[]> {
    try {
      const histories = await this.translationLoader.loadHistoryBySource(source, cacheTag);
      return histories.map((h) => ({
        id: h.id,
        source: h.source,
        target: h.target,
        success: h.success,
        error: h.error || undefined,
        model: h.model,
        createdAt: h.createdAt.toISOString(),
        cacheTag: h.cacheTag.name,
      }));
    } catch (error) {
      this.logger.error('번역 이력 조회 중 오류:', { error });
      return [];
    }
  }

  async getTranslations(texts: string[], cacheTag: string): Promise<Map<string, string | null>> {
    try {
      const translations = await this.translationLoader.loadManyBySource(texts, cacheTag);
      return new Map(
        Array.from(translations.entries()).map(([key, value]) => [key, value?.target || null])
      );
    } catch (error) {
      this.logger.error('번역 캐시 일괄 조회 중 오류:', { error });
      return new Map(texts.map((text) => [text, null]));
    }
  }

  async setTranslations(
    translations: Map<string, string>,
    success: boolean = true,
    modelName: string = 'unknown',
    cacheTag: string = DEFAULT_CACHE_TAG,
    error?: string
  ): Promise<void> {
    try {
      await this.translationLoader.saveManyTranslations(
        translations,
        success,
        modelName,
        cacheTag,
        error
      );
    } catch (error) {
      this.logger.error('번역 캐시 일괄 저장 중 오류:', { error, size: translations.size });
    }
  }

  async deleteTranslationsByIds(ids: number[]): Promise<void> {
    try {
      await this.translationLoader.deleteTranslationsByIds(ids);
    } catch (error) {
      this.logger.error('번역 캐시 항목 삭제 중 오류:', { error });
    }
  }

  async clear(): Promise<void> {
    try {
      await this.prisma.$transaction([
        this.prisma.translationHistory.deleteMany({}),
        this.prisma.translation.deleteMany({}),
      ]);
      this.translationLoader.clearCache();
    } catch (error) {
      this.logger.error('번역 캐시 삭제 중 오류:', { error });
    }
  }

  async invalidateMemoryCache(source: string, cacheTag: string): Promise<void> {
    // 소스 텍스트와 관련된 모든 캐시 초기화
    this.translationLoader.clearSourceCache(source, cacheTag);
  }

  async invalidateMemoryCacheMany(
    entries: Array<{ source: string; cacheTag: string }>
  ): Promise<void> {
    // 여러 소스 텍스트와 관련된 모든 캐시 초기화
    entries.forEach(({ source, cacheTag }) =>
      this.translationLoader.clearSourceCache(source, cacheTag)
    );
  }

  async findTranslationById(
    id: number
  ): Promise<{ source: string; target: string; cacheTag: string } | null> {
    try {
      const translation = await this.translationLoader.loadById(id);
      return translation
        ? {
            source: translation.source,
            target: translation.target,
            cacheTag: translation.cacheTag?.name || DEFAULT_CACHE_TAG,
          }
        : null;
    } catch (error) {
      this.logger.error('번역 ID로 조회 중 오류:', { error });
      return null;
    }
  }

  buildWhereFromSearchParams(searchParams: CacheSearchParams): Prisma.TranslationWhereInput {
    const where: Prisma.TranslationWhereInput = {};

    if (searchParams.searchValue && searchParams.searchType !== CacheSearchType.DATE) {
      const searchValue = searchParams.searchValue.trim();

      if (searchValue.length > 0) {
        switch (searchParams.searchType) {
          case CacheSearchType.SOURCE:
            where.source = { startsWith: searchValue };
            break;
          case CacheSearchType.TARGET:
            where.target = { startsWith: searchValue };
            break;
          case CacheSearchType.CACHE_TAG: {
            if (/^\d+$/.test(searchValue)) {
              const cacheTagId = Number.parseInt(searchValue, 10);
              where.cacheTagId = cacheTagId;
            } else {
              this.logger.warn('CACHE_TAG 검색값이 숫자가 아닙니다. 검색이 무시됩니다.', {
                searchValue,
              });
            }
            break;
          }
        }
      }
    }

    if (searchParams.searchType === CacheSearchType.DATE) {
      try {
        if (searchParams.startDate && searchParams.endDate) {
          const startDate = this.parseYYYYMMDD(searchParams.startDate);
          const endDate = this.parseYYYYMMDD(searchParams.endDate);
          endDate.setHours(23, 59, 59, 999);

          where.lastAccessedAt = { gte: startDate, lte: endDate };
        } else if (searchParams.startDate) {
          const startDate = this.parseYYYYMMDD(searchParams.startDate);
          where.lastAccessedAt = { gte: startDate };
        } else if (searchParams.endDate) {
          const endDate = this.parseYYYYMMDD(searchParams.endDate);
          endDate.setHours(23, 59, 59, 999);
          where.lastAccessedAt = { lte: endDate };
        }
      } catch (error) {
        this.logger.error('날짜 파싱 중 오류:', { error, searchParams });
      }
    }

    return where;
  }

  /**
   * YYYY/MM/DD 형식의 문자열을 Date 객체로 변환
   */
  private parseYYYYMMDD(dateStr: string): Date {
    if (!dateStr) return new Date();

    try {
      // YYYY/MM/DD 형식 파싱
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JavaScript의 월은 0부터 시작
        const day = parseInt(parts[2], 10);

        const date = new Date(year, month, day);

        // 유효한 날짜인지 확인
        if (isNaN(date.getTime())) {
          this.logger.warn('유효하지 않은 날짜 문자열:', { dateStr });
          return new Date();
        }

        return date;
      }

      // 다른 형식이거나 파싱 실패 시 그냥 Date 생성자에 전달
      const date = new Date(dateStr);

      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        this.logger.warn('유효하지 않은 날짜 문자열:', { dateStr });
        return new Date();
      }

      return date;
    } catch (error) {
      this.logger.error('날짜 파싱 중 오류 발생:', { dateStr, error });
      return new Date();
    }
  }

  /**
   * 검색 조건에 맞는 번역 목록을 페이지네이션하여 조회합니다.
   */
  async getTranslationsBySearchParams(
    page: number,
    itemsPerPage: number,
    searchParams: CacheSearchParams
  ): Promise<{
    translations: CacheTranslation[];
    totalItems: number;
  }> {
    try {
      const offset = (page - 1) * itemsPerPage;

      // 검색 조건 구성
      const where = this.buildWhereFromSearchParams(searchParams);

      // 전체 아이템 수 조회
      const totalItems = await this.prisma.translation.count({ where });

      const translations = await this.prisma.translation.findMany({
        where,
        skip: offset,
        take: itemsPerPage,
        orderBy: {
          lastAccessedAt: 'desc',
        },
        include: { cacheTag: true },
      });

      return {
        translations: this.transformTranslationsForResponse(translations),
        totalItems,
      };
    } catch (error) {
      this.logger.error('번역 검색 중 오류:', { error });
      return {
        translations: [],
        totalItems: 0,
      };
    }
  }

  /**
   * 번역 검색 결과를 클라이언트 응답 형식으로 변환합니다.
   */
  private transformTranslationsForResponse(
    translations: TranslationWithCacheTag[]
  ): CacheTranslation[] {
    return translations.map((t) => ({
      id: t.id,
      source: t.source,
      target: t.target,
      fileName: null,
      filePath: null,
      createdAt: t.createdAt.toISOString(),
      lastAccessedAt: t.lastAccessedAt.toISOString(),
      cacheTag: t.cacheTag?.name || DEFAULT_CACHE_TAG,
      cacheTagId: t.cacheTag?.id ?? null,
    }));
  }

  /**
   * 조건에 맞는 번역들을 조회합니다.
   */
  async findTranslationsByCondition(
    where: Prisma.TranslationWhereInput
  ): Promise<TranslationBasicInfo[]> {
    try {
      const translations = await this.prisma.translation.findMany({
        where,
        include: { cacheTag: true },
        orderBy: { lastAccessedAt: 'desc' },
      });
      return translations.map((t) => ({
        id: t.id,
        source: t.source,
        cacheTag: t.cacheTag?.name || DEFAULT_CACHE_TAG,
        cacheTagId: t.cacheTag?.id ?? null,
      }));
    } catch (error) {
      this.logger.error('번역 조건으로 조회 중 오류:', { error });
      return [];
    }
  }

  /**
   * 조건에 맞는 번역 항목 수를 계산합니다.
   */
  async countTranslations(where: Prisma.TranslationWhereInput): Promise<number> {
    try {
      return await this.prisma.translation.count({ where });
    } catch (error) {
      this.logger.error('번역 항목 수 계산 중 오류:', { error });
      return 0;
    }
  }

  /**
   * 페이지네이션을 적용하여 번역 목록을 조회합니다.
   */
  async findTranslationsWithPagination(
    where: Prisma.TranslationWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.TranslationOrderByWithRelationInput
  ): Promise<TranslationData[]> {
    try {
      const translations = await this.prisma.translation.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { cacheTag: true },
      });

      return translations.map((t) => ({
        id: t.id,
        source: t.source,
        target: t.target,
        createdAt: t.createdAt,
        lastAccessedAt: t.lastAccessedAt,
        success: t.success,
        cacheTag: {
          id: t.cacheTag?.id || 0,
          name: t.cacheTag?.name || DEFAULT_CACHE_TAG,
        },
      }));
    } catch (error) {
      this.logger.error('번역 페이지네이션 조회 중 오류:', { error });
      return [];
    }
  }

  /**
   * 번역 ID로 번역 이력을 조회합니다.
   */
  async findTranslationHistoryById(
    translationId: number
  ): Promise<Array<TranslationHistory & { translationId: number }>> {
    try {
      const histories = await this.translationLoader.loadHistoryByTranslationId(translationId);

      return histories.map((h) => ({
        id: h.id,
        translationId: h.translationId,
        source: h.source,
        target: h.target,
        success: h.success,
        error: h.error || undefined,
        model: h.model,
        createdAt: h.createdAt.toISOString(),
        cacheTag: h.cacheTag.name,
      }));
    } catch (error) {
      this.logger.error('번역 이력 ID로 조회 중 오류:', { error });
      return [];
    }
  }

  /**
   * 특정 ID를 가진 번역을 DB에서 업데이트합니다.
   */
  async updateTranslationInDb(
    id: number,
    translation: string,
    transactionClient?: Prisma.TransactionClient,
    transactionContext?: TransactionContext
  ): Promise<{ source: string; target: string; cacheTag: string } | null> {
    try {
      const updated = await this.translationLoader.updateTranslation(
        id,
        translation,
        transactionClient,
        transactionContext
      );
      return updated
        ? {
            source: updated.source,
            target: updated.target,
            cacheTag: updated.cacheTag?.name || DEFAULT_CACHE_TAG,
          }
        : null;
    } catch (error) {
      this.logger.error('번역 DB 업데이트 중 오류:', { error });
      return null;
    }
  }

  /**
   * 여러 ID로 번역을 조회합니다.
   */
  async findTranslationsByIds(ids: number[]): Promise<TranslationBasicInfo[]> {
    if (ids.length === 0) {
      return [];
    }

    try {
      const translations = await this.prisma.translation.findMany({
        where: { id: { in: ids } },
        include: { cacheTag: true },
        orderBy: { lastAccessedAt: 'desc' },
      });
      return translations.map((t) => ({
        id: t.id,
        source: t.source,
        cacheTag: t.cacheTag?.name || DEFAULT_CACHE_TAG,
        cacheTagId: t.cacheTag?.id ?? null,
      }));
    } catch (error) {
      this.logger.error('번역 IDs로 조회 중 오류:', { error });
      return [];
    }
  }

  /**
   * 검색 조건에 맞는 번역 목록을 페이지네이션하여 조회합니다.
   */
  async getTranslationsByConditions(
    page: number,
    itemsPerPage: number,
    searchParams: CacheSearchParams
  ): Promise<{
    translations: Array<CacheTranslation>;
    totalItems: number;
  }> {
    return this.getTranslationsBySearchParams(page, itemsPerPage, searchParams);
  }

  async getAllCacheTags(options?: CacheTagQueryOptions): Promise<CacheTagSummary[]> {
    try {
      const { keyword, sortBy, sortOrder } = options ?? {};

      const cacheTags = await this.prisma.cacheTag.findMany();

      const stats = await this.prisma.translation.groupBy({
        by: ['cacheTagId'],
        _max: { lastAccessedAt: true },
        _count: { id: true },
      });

      const statsMap = new Map<number, { lastUsedAt: string | null; translationCount: number }>();
      stats.forEach((stat) => {
        statsMap.set(stat.cacheTagId, {
          lastUsedAt: stat._max.lastAccessedAt ? stat._max.lastAccessedAt.toISOString() : null,
          translationCount: stat._count.id,
        });
      });

      let summaries = cacheTags.map<CacheTagSummary>((tag) => {
        const tagStats = statsMap.get(tag.id);
        return {
          id: tag.id,
          name: tag.name,
          createdAt: tag.createdAt.toISOString(),
          updatedAt: tag.updatedAt.toISOString(),
          lastUsedAt: tagStats?.lastUsedAt ?? null,
          translationCount: tagStats?.translationCount ?? 0,
        };
      });

      if (keyword?.trim()) {
        const normalizedKeyword = keyword.trim().toLowerCase();
        summaries = summaries.filter((tag) => tag.name.toLowerCase().includes(normalizedKeyword));
      }

      const resolvedSortBy = sortBy ?? 'name';
      const resolvedSortOrder: 'asc' | 'desc' =
        sortOrder ?? (resolvedSortBy === 'name' ? 'asc' : 'desc');
      const direction = resolvedSortOrder === 'asc' ? 1 : -1;

      const compareDate = (a: string | null, b: string | null): number => {
        if (!a && !b) {
          return 0;
        }
        if (!a) {
          return 1;
        }
        if (!b) {
          return -1;
        }
        const diff = new Date(a).getTime() - new Date(b).getTime();
        if (diff === 0) {
          return 0;
        }
        return diff > 0 ? direction : -direction;
      };

      summaries.sort((a, b) => {
        switch (resolvedSortBy) {
          case 'lastUsedAt': {
            const result = compareDate(a.lastUsedAt, b.lastUsedAt);
            if (result !== 0) {
              return result;
            }
            return a.name.localeCompare(b.name, 'ko');
          }
          case 'createdAt': {
            const result = compareDate(a.createdAt, b.createdAt);
            if (result !== 0) {
              return result;
            }
            return a.name.localeCompare(b.name, 'ko');
          }
          case 'name':
          default: {
            const nameCompare = a.name.localeCompare(b.name, 'ko');
            if (nameCompare !== 0) {
              return nameCompare * direction;
            }
            return compareDate(a.createdAt, b.createdAt);
          }
        }
      });

      return summaries;
    } catch (error) {
      this.logger.error('캐시 태그 조회 중 오류:', { error });
      return [];
    }
  }

  async findCacheTagById(id: number): Promise<CacheTagSummary | null> {
    try {
      const cacheTag = await this.prisma.cacheTag.findUnique({ where: { id } });
      if (!cacheTag) {
        return null;
      }

      const stats = await this.prisma.translation.aggregate({
        where: { cacheTagId: id },
        _max: { lastAccessedAt: true },
        _count: { id: true },
      });

      return {
        id: cacheTag.id,
        name: cacheTag.name,
        createdAt: cacheTag.createdAt.toISOString(),
        updatedAt: cacheTag.updatedAt.toISOString(),
        lastUsedAt: stats._max.lastAccessedAt ? stats._max.lastAccessedAt.toISOString() : null,
        translationCount: stats._count.id,
      };
    } catch (error) {
      this.logger.error('캐시 태그 단일 조회 중 오류:', { error, id });
      return null;
    }
  }

  async deleteCacheTag(id: number, options?: CacheTagDeletionOptions): Promise<void> {
    const mode = options?.mode ?? 'strict';

    try {
      if (mode === 'strict') {
        const translationCount = await this.prisma.translation.count({ where: { cacheTagId: id } });
        if (translationCount > 0) {
          throw new Error('해당 캐시 태그를 사용하는 번역이 있어 삭제할 수 없습니다.');
        }

        const historyCount = await this.prisma.translationHistory.count({
          where: { cacheTagId: id },
        });
        if (historyCount > 0) {
          throw new Error('해당 캐시 태그와 연결된 번역 이력이 있어 삭제할 수 없습니다.');
        }

        await this.prisma.cacheTag.deleteMany({ where: { id } });
        return;
      }

      if (mode === 'cascade') {
        await this.prisma.$transaction(async (tx) => {
          await tx.translationHistory.deleteMany({ where: { cacheTagId: id } });
          await tx.translation.deleteMany({ where: { cacheTagId: id } });
          await tx.cacheTag.deleteMany({ where: { id } });
        });

        this.translationLoader.clearCache();
        return;
      }

      if (mode === 'reassign') {
        const targetTagId = options?.targetTagId;
        if (!targetTagId) {
          throw new Error('재할당할 캐시 태그 ID가 필요합니다.');
        }

        const targetTag = await this.prisma.cacheTag.findUnique({ where: { id: targetTagId } });
        if (!targetTag) {
          throw new Error('재할당 대상 캐시 태그를 찾을 수 없습니다.');
        }

        await this.prisma.$transaction(async (tx) => {
          await tx.translation.updateMany({
            where: { cacheTagId: id },
            data: { cacheTagId: targetTagId },
          });

          await tx.translationHistory.updateMany({
            where: { cacheTagId: id },
            data: { cacheTagId: targetTagId },
          });

          await tx.cacheTag.deleteMany({ where: { id } });
        });

        this.translationLoader.clearCache();
        return;
      }

      throw new Error('지원하지 않는 캐시 태그 삭제 모드입니다.');
    } catch (error) {
      this.logger.error('캐시 태그 삭제 중 오류:', { error, id, options });
      throw error;
    }
  }

  async updateTranslationCacheTag(translationId: number, cacheTagId: number): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const translation = await tx.translation.findUnique({
          where: { id: translationId },
          include: { cacheTag: true },
        });

        if (!translation) {
          throw new Error('존재하지 않는 번역입니다.');
        }

        const targetTag = await tx.cacheTag.findUnique({ where: { id: cacheTagId } });
        if (!targetTag) {
          throw new Error('지정한 캐시 태그를 찾을 수 없습니다.');
        }

        await tx.translation.update({
          where: { id: translationId },
          data: { cacheTagId },
        });

        await tx.translationHistory.updateMany({
          where: { translationId },
          data: { cacheTagId },
        });
      });

      this.translationLoader.clearCache();
    } catch (error) {
      this.logger.error('번역 캐시 태그 변경 중 오류:', { error, translationId, cacheTagId });
      throw error;
    }
  }

  async updateTranslation(id: number, translation: string): Promise<void> {
    try {
      await this.translationLoader.updateTranslation(id, translation);
    } catch (error) {
      this.logger.error('번역 캐시 업데이트 중 오류:', { error });
    }
  }
}
