import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, Like, LessThanOrEqual, MoreThanOrEqual, In, Between } from 'typeorm';

import { TranslationLoaderService } from '../../../../cache/loader/translation-loader/translation-loader.service';
import { Translation, FileInfo } from '../../../../db/typeorm/entities';
import { TypeOrmService } from '../../../../db/typeorm/typeorm.service';
import { LoggerService } from '../../../../logger/logger.service';
import {
  FilePathInfo,
  TranslationHistory,
  TranslationData,
  CacheTranslation,
  TranslationBasicInfo,
} from '@/types/cache';
import { CacheSearchParams } from '@/types/common';

import { IDbCacheManagerService } from './i-db-cache-manager-service';

@Injectable()
export class SqliteCacheManagerService implements IDbCacheManagerService {
  constructor(
    private readonly orm: TypeOrmService,
    private readonly translationLoader: TranslationLoaderService,
    private readonly logger: LoggerService
  ) {}

  async getTranslation(text: string): Promise<string | null> {
    try {
      const translation = await this.translationLoader.loadBySource(text);
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
    fileInfo?: FileInfo,
    modelName: string = 'unknown'
  ): Promise<void> {
    try {
      await this.translationLoader.saveTranslation(text, translation, success, fileInfo, modelName);
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
        undefined,
        history.model
      );
    } catch (error) {
      this.logger.error('번역 이력 저장 중 오류:', { error });
    }
  }

  async getTranslationHistory(source: string): Promise<TranslationHistory[]> {
    try {
      const histories = await this.translationLoader.loadHistoryBySource(source);
      return histories.map((h) => ({
        id: h.id,
        source: h.source,
        target: h.target,
        success: h.success,
        error: h.error || undefined,
        model: h.model,
        createdAt: h.createdAt.toISOString(),
      }));
    } catch (error) {
      this.logger.error('번역 이력 조회 중 오류:', { error });
      return [];
    }
  }

  async getTranslations(texts: string[]): Promise<Map<string, string | null>> {
    try {
      const translations = await this.translationLoader.loadManyBySource(texts);
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
    fileInfo?: FilePathInfo,
    modelName: string = 'unknown'
  ): Promise<void> {
    try {
      await this.translationLoader.saveManyTranslations(translations, success, fileInfo, modelName);
    } catch (error) {
      this.logger.error('번역 캐시 일괄 저장 중 오류:', { error, size: translations.size });
    }
  }

  async deleteTranslationsByIds(ids: number[]): Promise<void> {
    try {
      const translations = await this.translationLoader.loadManyById(ids);

      await this.orm.translation.delete(ids);

      // 캐시 초기화 - 번역과 이력 모두 초기화
      ids.forEach((id) => this.translationLoader.clearIdCache(id));
      translations.forEach((t) => {
        if (t) {
          this.translationLoader.clearSourceCache(t.source);
        }
      });
    } catch (error) {
      this.logger.error('번역 캐시 항목 삭제 중 오류:', { error });
    }
  }

  async clear(): Promise<void> {
    try {
      await this.orm.translation.clear();
      // 모든 캐시 초기화
      this.translationLoader.clearCache();
    } catch (error) {
      this.logger.error('번역 캐시 삭제 중 오류:', { error });
    }
  }

  async invalidateMemoryCache(text: string): Promise<void> {
    // 소스 텍스트와 관련된 모든 캐시 초기화
    this.translationLoader.clearSourceCache(text);
  }

  async invalidateMemoryCacheMany(texts: string[]): Promise<void> {
    // 여러 소스 텍스트와 관련된 모든 캐시 초기화
    texts.forEach((text) => this.translationLoader.clearSourceCache(text));
  }

  async findTranslationById(id: number): Promise<{ source: string; target: string } | null> {
    try {
      const translation = await this.translationLoader.loadById(id);
      return translation ? { source: translation.source, target: translation.target } : null;
    } catch (error) {
      this.logger.error('번역 ID로 조회 중 오류:', { error });
      return null;
    }
  }

  /**
   * searchParams를 TypeORM where 조건으로 변환합니다.
   */
  buildWhereFromSearchParams(searchParams: CacheSearchParams): FindOptionsWhere<Translation> {
    const where: FindOptionsWhere<Translation> = {};

    // 검색 타입에 따라 다른 필드에 Like 검색 조건 적용
    if (searchParams.searchValue && searchParams.searchType !== 'date') {
      const { searchValue } = searchParams;

      switch (searchParams.searchType) {
        case 'source':
          where.source = Like(`${searchValue}%`);
          break;
        case 'target':
          where.target = Like(`${searchValue}%`);
          break;
        case 'fileName':
          where.fileInfo = {
            fileName: Like(`${searchValue}%`),
          };
          break;
        case 'filePath':
          where.fileInfo = {
            filePath: Like(`${searchValue}%`),
          };
          break;
      }
    }

    // 날짜 검색 조건 적용
    if (searchParams.searchType === 'date') {
      // 날짜 검색인 경우에만 날짜 조건 적용
      try {
        if (searchParams.startDate && searchParams.endDate) {
          // 시작일과 종료일이 모두 있는 경우
          const startDate = this.parseYYYYMMDD(searchParams.startDate);
          const endDate = this.parseYYYYMMDD(searchParams.endDate);
          // 종료일은 해당 일자의 23:59:59로 설정하여 하루 전체 포함
          endDate.setHours(23, 59, 59, 999);

          where.lastAccessedAt = Between(startDate, endDate);
        } else if (searchParams.startDate) {
          // 시작일만 있는 경우
          const startDate = this.parseYYYYMMDD(searchParams.startDate);
          where.lastAccessedAt = MoreThanOrEqual(startDate);
        } else if (searchParams.endDate) {
          // 종료일만 있는 경우
          const endDate = this.parseYYYYMMDD(searchParams.endDate);
          endDate.setHours(23, 59, 59, 999);
          where.lastAccessedAt = LessThanOrEqual(endDate);
        }
      } catch (error) {
        this.logger.error('날짜 파싱 중 오류:', { error, searchParams });
        // 날짜 파싱 오류 시 빈 결과를 반환하지 않도록 처리
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
      const totalItems = await this.orm.translation.count({ where });

      // 페이지네이션된 데이터 조회
      const translations = await this.orm.translation.find({
        where,
        relations: {
          fileInfo: true,
        },
        skip: offset,
        take: itemsPerPage,
        order: {
          lastAccessedAt: 'DESC',
        },
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
  private transformTranslationsForResponse(translations: Translation[]): CacheTranslation[] {
    return translations.map((t) => ({
      id: t.id,
      source: t.source,
      target: t.target,
      fileName: t.fileInfo?.fileName || null,
      filePath: t.fileInfo?.filePath || null,
      createdAt: t.createdAt.toISOString(),
      lastAccessedAt: t.lastAccessedAt.toISOString(),
    }));
  }

  /**
   * 조건에 맞는 번역들을 조회합니다.
   */
  async findTranslationsByCondition(
    where: FindOptionsWhere<Translation>
  ): Promise<TranslationBasicInfo[]> {
    try {
      const translations = await this.orm.translation.find({
        where,
        select: { id: true, source: true },
      });
      return translations;
    } catch (error) {
      this.logger.error('번역 조건으로 조회 중 오류:', { error });
      return [];
    }
  }

  /**
   * 조건에 맞는 번역 항목 수를 계산합니다.
   */
  async countTranslations(where: FindOptionsWhere<Translation>): Promise<number> {
    try {
      return await this.orm.translation.count({ where });
    } catch (error) {
      this.logger.error('번역 항목 수 계산 중 오류:', { error });
      return 0;
    }
  }

  /**
   * 페이지네이션을 적용하여 번역 목록을 조회합니다.
   */
  async findTranslationsWithPagination(
    where: FindOptionsWhere<Translation>,
    skip: number,
    take: number,
    orderBy: Record<string, 'ASC' | 'DESC'>
  ): Promise<TranslationData[]> {
    try {
      const translations = await this.orm.translation.find({
        where,
        relations: {
          fileInfo: true,
        },
        skip,
        take,
        order: orderBy,
      });

      return translations.map((t) => ({
        id: t.id,
        source: t.source,
        target: t.target,
        fileInfo: t.fileInfo
          ? {
              fileName: t.fileInfo.fileName,
              filePath: t.fileInfo.filePath,
            }
          : null,
        createdAt: t.createdAt,
        lastAccessedAt: t.lastAccessedAt,
        success: t.success,
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
      const history = await this.orm.translationHistory.find({
        where: {
          translation: { id: translationId },
        },
        relations: {
          translation: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });

      return history.map((h) => ({
        id: h.id,
        translationId: h.translation.id,
        source: h.source,
        target: h.target,
        success: h.success,
        error: h.error || undefined,
        model: h.model,
        createdAt: h.createdAt.toISOString(),
      }));
    } catch (error) {
      this.logger.error('번역 이력 ID로 조회 중 오류:', { error });
      return [];
    }
  }

  /**
   * 특정 ID를 가진 번역을 DB에서 업데이트합니다.
   */
  async updateTranslationInDb(id: number, translation: string): Promise<void> {
    try {
      await this.orm.translation.update(
        { id },
        {
          target: translation,
          lastAccessedAt: new Date(),
        }
      );
    } catch (error) {
      this.logger.error('번역 DB 업데이트 중 오류:', { error });
    }
  }

  /**
   * 여러 ID로 번역을 조회합니다.
   */
  async findTranslationsByIds(ids: number[]): Promise<TranslationBasicInfo[]> {
    try {
      return await this.orm.translation.find({
        where: { id: In(ids) },
        select: { id: true, source: true },
      });
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

  async updateTranslation(id: number, translation: string): Promise<void> {
    try {
      const existingTranslation = await this.translationLoader.loadById(id);
      if (existingTranslation) {
        await this.translationLoader.saveTranslation(
          existingTranslation.source,
          translation,
          true,
          existingTranslation.fileInfo || undefined
        );
        // 캐시 초기화 - 번역과 이력 모두 초기화
        this.translationLoader.clearIdCache(id);
        this.translationLoader.clearSourceCache(existingTranslation.source);
      }
    } catch (error) {
      this.logger.error('번역 캐시 업데이트 중 오류:', { error });
    }
  }
}
