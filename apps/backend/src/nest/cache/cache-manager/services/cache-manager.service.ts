import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import sharp from 'sharp';
import {
  CacheTagQueryOptions,
  IDbCacheManagerService,
} from '../db-cache-manager/services/i-db-cache-manager-service';
import { IMemoryCacheManagerService } from '../memory-cache-manager/services/i-memory-cache-manager-service';
import { LoggerService } from '../../../logger/logger.service';
import { CacheCommandBus } from '@/nest/cache/commands/command-bus.service';
import { ImportTranslationsCommand } from '@/nest/cache/commands/commands/import-translations.command';
import {
  TranslationHistory,
  TranslationExportImport,
  CacheTranslation,
  CacheTagSummary,
  CacheTagDeletionOptions,
} from '@apps/common/dist/types/cache';
import { CacheSearchParams } from '@apps/common/dist/types/common';
import { ICacheManagerService } from './i-cache-manager-service';
import { DEFAULT_CACHE_TAG } from '@apps/common/dist/constants/cache';
import { normalizeCacheTag } from '@apps/common/dist/utils/cache-tag';
import { buildMemoryCacheKey } from '../utils/cache-key';

const CACHE_ENABLED = process.env.CACHE_ENABLED === 'false' ? false : true;

@Injectable()
export class CacheManagerService implements ICacheManagerService {
  constructor(
    @Inject(IMemoryCacheManagerService)
    private readonly memoryCacheManagerService: IMemoryCacheManagerService,
    @Inject(IDbCacheManagerService)
    private readonly dbCacheManagerService: IDbCacheManagerService,
    private readonly commandBus: CacheCommandBus,
    private readonly logger: LoggerService
  ) {}

  private getMemoryCacheKey(source: string, cacheTag?: string | null): string {
    return cacheTag ? buildMemoryCacheKey(source, cacheTag) : source;
  }

  /**
   * 메모리 캐시의 특정 항목을 무효화합니다.
   * @param text 무효화할 원본 텍스트
   */
  public async invalidateMemoryCache(source: string, cacheTag: string): Promise<void> {
    await this.memoryCacheManagerService.invalidate(buildMemoryCacheKey(source, cacheTag));
  }

  /**
   * 메모리 캐시의 여러 항목을 무효화합니다.
   * @param texts 무효화할 원본 텍스트 배열
   */
  public async invalidateMemoryCacheMany(
    entries: Array<{ source: string; cacheTag: string }>
  ): Promise<void> {
    if (entries.length > 0) {
      const keys = entries.map((entry) => buildMemoryCacheKey(entry.source, entry.cacheTag));
      await this.memoryCacheManagerService.invalidateMany(keys);
    }
  }

  /**
   * 번역 항목을 업데이트합니다.
   * DB와 메모리 캐시를 모두 업데이트합니다.
   * @param id 업데이트할 번역 ID
   * @param translation 새 번역 텍스트
   * @param source 원본 텍스트 (알고 있는 경우에만 제공)
   */
  public async updateTranslation(
    id: number,
    translation: string,
    source?: string,
    cacheTag?: string
  ): Promise<void> {
    // 1. DB 업데이트를 먼저 수행하고, 업데이트된 정보를 반환받음
    const updatedInfo = await this.dbCacheManagerService.updateTranslationInDb(id, translation);

    // 2. DB 업데이트 성공 시 메모리 캐시 업데이트
    const sourceText = source || updatedInfo?.source;
    if (sourceText) {
      const normalizedTag = normalizeCacheTag(cacheTag || updatedInfo?.cacheTag);
      await this.memoryCacheManagerService.setTranslation(
        buildMemoryCacheKey(sourceText, normalizedTag),
        translation
      );
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

    // 2. DB에서 번역 삭제
    await this.dbCacheManagerService.deleteTranslationsByIds(ids);

    // 3. DB 작업 성공 후, 메모리 캐시에서 해당 항목들을 무효화
    if (translationsToDelete.length > 0) {
      await this.invalidateMemoryCacheMany(
        translationsToDelete.map((t) => ({ source: t.source, cacheTag: t.cacheTag }))
      );
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
      if (translationsToDelete.length == 0) return;

      await this.invalidateMemoryCacheMany(
        translationsToDelete.map((t) => ({ source: t.source, cacheTag: t.cacheTag }))
      );
    } catch (error) {
      // DB 조회 중 오류 발생 시 로그만 남기고 진행
      this.logger.error('메모리 캐시 무효화를 위한 DB 조회 중 오류:', { error });
      // 선택적 캐시 무효화 실패 - 작업은 계속 진행
    }
  }

  public async getCacheKeyFromImage(base64Image: string): Promise<string> {
    // base64Image는 순수 base64 문자열이라고 가정. data URL이 올 경우 접두어 제거.
    const clean = base64Image.startsWith('data:')
      ? base64Image.substring(base64Image.indexOf(',') + 1)
      : base64Image;

    const imageBuffer = Buffer.from(clean, 'base64');

    // sharp로 디코딩 후, sRGB + RGBA로 정규화하고 raw 픽셀 버퍼를 얻는다.
    // 이렇게 하면 EXIF Orientation, 메타데이터, 압축 차이 등을 무시하고 동일 픽셀에 동일 해시가 생성됨.
    const image = sharp(imageBuffer, { failOn: 'none' });

    const { data, info } = await image
      .rotate() // EXIF Orientation 적용
      .ensureAlpha()
      .toColorspace('srgb')
      .raw()
      .toBuffer({ resolveWithObject: true });

    const hash = crypto
      .createHash('sha256')
      .update(data)
      // 해상도/채널 정보도 포함하여 동일 픽셀 배열이 해상도 오인으로 충돌하지 않도록 함
      .update(`${info.width}x${info.height}x${info.channels}`)
      .digest('hex');

    return `image:${hash}`;
  }

  public async getTranslation(text: string, cacheTag?: string): Promise<string | null> {
    if (!CACHE_ENABLED) return null;
    const normalizedTag = cacheTag === undefined ? null : normalizeCacheTag(cacheTag);
    const memoryKey = this.getMemoryCacheKey(text, normalizedTag);
    // 먼저 메모리 캐시에서 검색
    let translation = await this.memoryCacheManagerService.getTranslation(memoryKey);

    // 메모리에 없으면 DB 캐시에서 검색
    if (translation === null) {
      const dbTag = normalizedTag ?? DEFAULT_CACHE_TAG;
      translation = await this.dbCacheManagerService.getTranslation(text, dbTag);

      // DB에서 찾았다면 메모리 캐시에도 저장
      if (translation !== null) {
        await this.memoryCacheManagerService.setTranslation(memoryKey, translation);
      }
    }

    return translation;
  }

  public async setTranslation(
    text: string,
    translation: string,
    success: boolean = true,
    modelName?: string,
    cacheTag?: string,
    error?: string
  ): Promise<void> {
    const normalizedTag = cacheTag === undefined ? null : normalizeCacheTag(cacheTag);
    const dbTag = normalizedTag ?? DEFAULT_CACHE_TAG;
    const memoryKey = this.getMemoryCacheKey(text, normalizedTag);
    // 성공한 결과만 메모리 캐시에 유지하고, 실패 결과는 DB/이력에만 남깁니다.
    const memoryOperation = success
      ? this.memoryCacheManagerService.setTranslation(memoryKey, translation)
      : this.memoryCacheManagerService.invalidate(memoryKey);

    await Promise.all([
      memoryOperation,
      this.dbCacheManagerService.setTranslation(
        text,
        translation,
        success,
        modelName,
        dbTag,
        error
      ),
    ]);
  }

  public async getTranslations(
    texts: string[],
    cacheTag: string
  ): Promise<Map<string, string | null>> {
    const normalizedTag = normalizeCacheTag(cacheTag);
    if (!CACHE_ENABLED) {
      const result = new Map<string, string | null>();
      texts.forEach((text) => result.set(text, null));
      return result;
    }

    // 먼저 메모리 캐시에서 모든 텍스트 검색
    const keys = texts.map((text) => buildMemoryCacheKey(text, normalizedTag));
    const memoryRawResults = await this.memoryCacheManagerService.getTranslations(keys);
    const memoryResults = new Map<string, string | null>();
    texts.forEach((source, index) => {
      const key = keys[index];
      memoryResults.set(source, memoryRawResults.get(key) ?? null);
    });

    // 메모리에서 찾지 못한 텍스트 필터링
    const missingTexts = texts.filter((text) => memoryResults.get(text) === null);

    if (missingTexts.length === 0) {
      // 모든 텍스트가 메모리 캐시에 있음
      return memoryResults;
    }

    // DB에서 누락된 텍스트 검색
    const dbResults = await this.dbCacheManagerService.getTranslations(missingTexts, normalizedTag);

    // DB에서 찾은 항목을 메모리 캐시에 저장
    const dbFoundEntries = Array.from(dbResults.entries()).filter(
      ([, translation]) => translation !== null
    ) as [string, string][];

    if (dbFoundEntries.length > 0) {
      const dbFoundMap = new Map(
        dbFoundEntries.map(([source, value]) => [buildMemoryCacheKey(source, normalizedTag), value])
      );
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
    modelName?: string,
    cacheTag?: string,
    error?: string
  ): Promise<void> {
    const normalizedTag = cacheTag === undefined ? null : normalizeCacheTag(cacheTag);
    const dbTag = normalizedTag ?? DEFAULT_CACHE_TAG;
    const memoryKeys = Array.from(translations.keys()).map((source) =>
      this.getMemoryCacheKey(source, normalizedTag)
    );
    const memoryOperation = success
      ? this.memoryCacheManagerService.setTranslations(
          new Map(
            Array.from(translations.entries()).map(([source, value]) => [
              this.getMemoryCacheKey(source, normalizedTag),
              value,
            ])
          )
        )
      : this.memoryCacheManagerService.invalidateMany(memoryKeys);

    await Promise.all([
      memoryOperation,
      this.dbCacheManagerService.setTranslations(translations, success, modelName, dbTag, error),
    ]);
  }

  public async addTranslationHistory(history: TranslationHistory): Promise<void> {
    // 메모리와 DB 모두에 저장
    await this.dbCacheManagerService.addTranslationHistory(history);
  }

  public async getTranslationHistory(
    source: string,
    cacheTag: string
  ): Promise<TranslationHistory[]> {
    // DB에서만 이력 조회 (메모리는 임시 저장소)
    return this.dbCacheManagerService.getTranslationHistory(source, cacheTag);
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

  public async getCacheTags(options?: CacheTagQueryOptions): Promise<CacheTagSummary[]> {
    return this.dbCacheManagerService.getAllCacheTags(options);
  }

  public async deleteCacheTag(id: number, options?: CacheTagDeletionOptions): Promise<void> {
    const cacheTag = await this.dbCacheManagerService.findCacheTagById(id);

    if (!cacheTag) {
      throw new Error('존재하지 않는 캐시 태그입니다.');
    }

    if (cacheTag.name === DEFAULT_CACHE_TAG) {
      throw new Error('기본 캐시 태그는 삭제할 수 없습니다.');
    }

    const mode = options?.mode ?? 'strict';
    const translationsToInvalidate = await this.dbCacheManagerService.findTranslationsByCondition({
      cacheTag: { id },
    });

    let targetTagName: string | null = null;
    if (mode === 'reassign') {
      const targetTagId = options?.targetTagId;
      if (!targetTagId) {
        throw new Error('재할당할 캐시 태그 ID가 필요합니다.');
      }
      if (targetTagId === id) {
        throw new Error('동일한 캐시 태그로는 재할당할 수 없습니다.');
      }

      const targetTag = await this.dbCacheManagerService.findCacheTagById(targetTagId);
      if (!targetTag) {
        throw new Error('재할당 대상 캐시 태그를 찾을 수 없습니다.');
      }
      targetTagName = targetTag.name;
    }

    await this.dbCacheManagerService.deleteCacheTag(id, {
      mode,
      targetTagId: options?.targetTagId,
    });

    if (translationsToInvalidate.length > 0) {
      await this.invalidateMemoryCacheMany(
        translationsToInvalidate.map((translation) => ({
          source: translation.source,
          cacheTag: normalizeCacheTag(translation.cacheTag),
        }))
      );

      if (mode === 'reassign' && targetTagName) {
        const normalizedTarget = normalizeCacheTag(targetTagName);
        await this.invalidateMemoryCacheMany(
          translationsToInvalidate.map((translation) => ({
            source: translation.source,
            cacheTag: normalizedTarget,
          }))
        );
      }
    }
  }

  public async updateTranslationCacheTag(translationId: number, cacheTagId: number): Promise<void> {
    const [translation] = await this.dbCacheManagerService.findTranslationsByIds([translationId]);
    if (!translation) {
      throw new Error('존재하지 않는 번역입니다.');
    }

    if (translation.cacheTagId === cacheTagId) {
      return;
    }

    const targetTag = await this.dbCacheManagerService.findCacheTagById(cacheTagId);
    if (!targetTag) {
      throw new Error('지정한 캐시 태그를 찾을 수 없습니다.');
    }

    await this.dbCacheManagerService.updateTranslationCacheTag(translationId, cacheTagId);

    const normalizedOriginalTag = normalizeCacheTag(translation.cacheTag);
    const normalizedTargetTag = normalizeCacheTag(targetTag.name);

    await this.invalidateMemoryCacheMany([
      { source: translation.source, cacheTag: normalizedOriginalTag },
      { source: translation.source, cacheTag: normalizedTargetTag },
    ]);
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
      cacheTag: h.cacheTag,
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
        cacheTag: t.cacheTag,
      }));
    } catch (error) {
      this.logger.error('번역 내보내기 중 오류가 발생했습니다:', { error });
      throw error;
    }
  }

  public async importTranslations(translations: TranslationExportImport[]): Promise<number> {
    try {
      if (translations.length === 0) {
        return 0;
      }

      return await this.commandBus.execute(new ImportTranslationsCommand(translations));
    } catch (error) {
      this.logger.error('번역 가져오기 중 오류가 발생했습니다:', { error });
      throw error;
    }
  }
}
