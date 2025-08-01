import { Inject, Injectable } from '@nestjs/common';

import { IDbCacheManagerService } from '../db-cache-manager/services/i-db-cache-manager-service';
import { IMemoryCacheManagerService } from '../memory-cache-manager/services/i-memory-cache-manager-service';
import { LoggerService } from '../../../logger/logger.service';
import { FileInfo } from '../../../db/typeorm/entities';
import { TranslationHistory, TranslationExportImport, CacheTranslation } from '@/types/cache';
import { CacheSearchParams } from '@/types/common';
import { ICacheManagerService } from './i-cache-manager-service';

@Injectable()
export class CacheManagerService implements ICacheManagerService {
  constructor(
    @Inject(IMemoryCacheManagerService)
    private readonly memoryCacheManagerService: IMemoryCacheManagerService,
    @Inject(IDbCacheManagerService)
    private readonly dbCacheManagerService: IDbCacheManagerService,
    private readonly logger: LoggerService
  ) {}

  /**
   * 메모리 캐시의 특정 항목을 무효화합니다.
   * @param text 무효화할 원본 텍스트
   */
  public async invalidateMemoryCache(text: string): Promise<void> {
    await this.memoryCacheManagerService.invalidate(text);
  }

  /**
   * 메모리 캐시의 여러 항목을 무효화합니다.
   * @param texts 무효화할 원본 텍스트 배열
   */
  public async invalidateMemoryCacheMany(texts: string[]): Promise<void> {
    if (texts.length > 0) {
      await this.memoryCacheManagerService.invalidateMany(texts);
    }
  }

  /**
   * 번역 항목을 업데이트합니다.
   * DB와 메모리 캐시를 모두 업데이트합니다.
   * @param id 업데이트할 번역 ID
   * @param translation 새 번역 텍스트
   * @param source 원본 텍스트 (알고 있는 경우에만 제공)
   */
  public async updateTranslation(id: number, translation: string, source?: string): Promise<void> {
    // 1. DB 업데이트를 먼저 수행하고, 업데이트된 정보를 반환받음
    const updatedInfo = await this.dbCacheManagerService.updateTranslationInDb(id, translation);

    // 2. DB 업데이트 성공 시 메모리 캐시 업데이트
    const sourceText = source || updatedInfo?.source;
    if (sourceText) {
      await this.memoryCacheManagerService.setTranslation(sourceText, translation);
    } else {
      this.logger.warn(
        `Translation (ID: ${id}) updated, but source text is unknown. Cannot update memory cache precisely.`
      );
    }
  }

  /**
   * 선택한 번역 항목들을 삭제합니다.
   * @param ids 삭제할 번역 ID 배열
   */
  public async deleteTranslations(ids: number[]): Promise<void> {
    // 1. DB에서 삭제하기 전에, 해당 항목들의 source 텍스트를 조회
    const translationsToDelete = await this.dbCacheManagerService.findTranslationsByIds(ids);
    const sourceTexts = translationsToDelete.map((t) => t.source);

    // 2. DB에서 번역 삭제
    await this.dbCacheManagerService.deleteTranslationsByIds(ids);

    // 3. DB 작업 성공 후, 메모리 캐시에서 해당 항목들을 무효화
    if (sourceTexts.length > 0) {
      await this.invalidateMemoryCacheMany(sourceTexts);
    }
  }

  /**
   * 검색 조건에 맞는 모든 번역 항목을 삭제합니다.
   * @param searchParams 검색 조건
   */
  public async deleteAllTranslations(searchParams: CacheSearchParams): Promise<void> {
    try {
      // DB를 먼저 통해 삭제할 항목 찾기
      const where = await this.dbCacheManagerService.buildWhereFromSearchParams(searchParams);
      const translationsToDelete =
        await this.dbCacheManagerService.findTranslationsByCondition(where);
      const ids = translationsToDelete.map((t) => t.id);
      await this.dbCacheManagerService.deleteTranslationsByIds(ids);

      // 메모리 캐시에서도 삭제
      const sourceTexts = translationsToDelete.map((t) => t.source);

      if (sourceTexts.length == 0) return;

      await this.invalidateMemoryCacheMany(sourceTexts);
    } catch (error) {
      // DB 조회 중 오류 발생 시 로그만 남기고 진행
      this.logger.error('메모리 캐시 무효화를 위한 DB 조회 중 오류:', { error });
      // 선택적 캐시 무효화 실패 - 작업은 계속 진행
    }
  }

  public async getTranslation(text: string): Promise<string | null> {
    // 먼저 메모리 캐시에서 검색
    let translation = await this.memoryCacheManagerService.getTranslation(text);

    // 메모리에 없으면 DB 캐시에서 검색
    if (translation === null) {
      translation = await this.dbCacheManagerService.getTranslation(text);

      // DB에서 찾았다면 메모리 캐시에도 저장
      if (translation !== null) {
        await this.memoryCacheManagerService.setTranslation(text, translation);
      }
    }

    return translation;
  }

  public async setTranslation(
    text: string,
    translation: string,
    success: boolean = true,
    fileInfo?: FileInfo,
    modelName?: string
  ): Promise<void> {
    // 메모리와 DB 모두에 저장
    await Promise.all([
      this.memoryCacheManagerService.setTranslation(text, translation),
      this.dbCacheManagerService.setTranslation(text, translation, success, fileInfo, modelName),
    ]);
  }

  public async getTranslations(texts: string[]): Promise<Map<string, string | null>> {
    // 먼저 메모리 캐시에서 모든 텍스트 검색
    const memoryResults = await this.memoryCacheManagerService.getTranslations(texts);

    // 메모리에서 찾지 못한 텍스트 필터링
    const missingTexts = texts.filter((text) => memoryResults.get(text) === null);

    if (missingTexts.length === 0) {
      // 모든 텍스트가 메모리 캐시에 있음
      return memoryResults;
    }

    // DB에서 누락된 텍스트 검색
    const dbResults = await this.dbCacheManagerService.getTranslations(missingTexts);

    // DB에서 찾은 항목을 메모리 캐시에 저장
    const dbFoundEntries = Array.from(dbResults.entries()).filter(
      ([, translation]) => translation !== null
    ) as [string, string][];

    if (dbFoundEntries.length > 0) {
      const dbFoundMap = new Map(dbFoundEntries);
      await this.memoryCacheManagerService.setTranslations(dbFoundMap);
    }

    // 최종 결과 병합
    const result = new Map<string, string | null>(memoryResults);

    for (const [text, translation] of dbResults.entries()) {
      if (translation !== null) {
        result.set(text, translation);
      }
    }

    return result;
  }

  public async setTranslations(
    translations: Map<string, string>,
    success: boolean = true,
    fileInfo?: FileInfo,
    modelName?: string
  ): Promise<void> {
    // 메모리와 DB 모두에 저장
    await Promise.all([
      this.memoryCacheManagerService.setTranslations(translations),
      this.dbCacheManagerService.setTranslations(translations, success, fileInfo, modelName),
    ]);
  }

  public async addTranslationHistory(history: TranslationHistory): Promise<void> {
    // 메모리와 DB 모두에 저장
    await this.dbCacheManagerService.addTranslationHistory(history);
  }

  public async getTranslationHistory(source: string): Promise<TranslationHistory[]> {
    // DB에서만 이력 조회 (메모리는 임시 저장소)
    return this.dbCacheManagerService.getTranslationHistory(source);
  }

  public async clear(): Promise<void> {
    // 메모리와 DB 모두 초기화
    await Promise.all([this.memoryCacheManagerService.clear(), this.dbCacheManagerService.clear()]);
  }

  /**
   * 검색 조건에 맞는 번역 목록을 페이지네이션하여 조회합니다.
   * @param page 페이지 번호 (1부터 시작)
   * @param itemsPerPage 페이지당 항목 수
   * @param searchParams 검색 조건
   */
  public async getTranslationsByConditions(
    page: number,
    itemsPerPage: number,
    searchParams: CacheSearchParams
  ): Promise<{
    translations: Array<CacheTranslation>;
    totalItems: number;
  }> {
    // DB 캐시 메소드를 직접 호출
    return this.dbCacheManagerService.getTranslationsBySearchParams(
      page,
      itemsPerPage,
      searchParams
    );
  }

  /**
   * 번역 ID로 번역 이력을 조회합니다.
   * @param translationId 번역 ID
   */
  public async getTranslationHistoryById(translationId: number): Promise<TranslationHistory[]> {
    const history = await this.dbCacheManagerService.findTranslationHistoryById(translationId);

    return history.map((h) => ({
      source: h.source,
      target: h.target,
      success: h.success,
      error: h.error,
      model: h.model,
      createdAt: h.createdAt,
    }));
  }

  public async exportTranslations(
    searchParams: CacheSearchParams
  ): Promise<TranslationExportImport[]> {
    try {
      const { translations } = await this.getTranslationsByConditions(
        1,
        Number.MAX_SAFE_INTEGER,
        searchParams
      );
      // 필요한 필드만 선택
      return translations.map((t) => ({
        id: t.id,
        source: t.source,
        target: t.target,
      }));
    } catch (error) {
      this.logger.error('번역 내보내기 중 오류가 발생했습니다:', { error });
      throw error;
    }
  }

  public async importTranslations(translations: TranslationExportImport[]): Promise<number> {
    try {
      let updatedCount = 0;

      for (const translation of translations) {
        const existingTranslation = await this.dbCacheManagerService.findTranslationById(
          translation.id
        );

        if (existingTranslation && existingTranslation.source === translation.source) {
          await this.updateTranslation(translation.id, translation.target, translation.source);
          updatedCount++;
        }
      }

      return updatedCount;
    } catch (error) {
      this.logger.error('번역 가져오기 중 오류가 발생했습니다:', { error });
      throw error;
    }
  }
}
