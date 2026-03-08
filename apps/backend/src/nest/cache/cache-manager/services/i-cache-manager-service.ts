import {
  TranslationHistory,
  CacheTranslation,
  TranslationExportImport,
  CacheTagSummary,
  CacheTagDeletionOptions,
} from '@apps/common/dist/types/cache';
import { CacheSearchParams } from '@apps/common/dist/types/common';
import { CacheTagQueryOptions } from '../db-cache-manager/services/i-db-cache-manager-service';

/**
 * 캐시 관리 최상위 인터페이스
 * CacheManagerService 클래스가 구현하는 인터페이스입니다.
 */
export interface ICacheManagerService {
  getTranslation(text: string, cacheTag?: string): Promise<string | null>;
  setTranslation(
    text: string,
    translation: string,
    success?: boolean,
    modelName?: string,
    cacheTag?: string,
    error?: string
  ): Promise<void>;
  getTranslations(texts: string[], cacheTag: string): Promise<Map<string, string | null>>;
  setTranslations(
    translations: Map<string, string>,
    success?: boolean,
    modelName?: string,
    cacheTag?: string,
    error?: string
  ): Promise<void>;
  addTranslationHistory(history: TranslationHistory): Promise<void>;
  getTranslationHistory(source: string, cacheTag: string): Promise<TranslationHistory[]>;
  clear(): Promise<void>;

  // 캐시 관리 관련 메서드
  invalidateMemoryCache(source: string, cacheTag: string): Promise<void>;
  invalidateMemoryCacheMany(entries: Array<{ source: string; cacheTag: string }>): Promise<void>;
  updateTranslation(
    id: number,
    translation: string,
    source?: string,
    cacheTag?: string
  ): Promise<void>;
  deleteTranslations(ids: number[]): Promise<void>;
  deleteAllTranslations(searchParams: CacheSearchParams): Promise<void>;

  /**
   * 이미지의 EXIF/메타데이터와 인코딩 차이를 무시하고,
   * 픽셀 버퍼(정규화된 sRGB + RGBA) 기준으로 캐시 키를 생성합니다.
   */
  getCacheKeyFromImage(base64Image: string): Promise<string>;

  // 검색 및 이력 조회 관련 메서드
  getTranslationsByConditions(
    page: number,
    itemsPerPage: number,
    searchParams: CacheSearchParams
  ): Promise<{
    translations: CacheTranslation[];
    totalItems: number;
  }>;

  getTranslationHistoryById(translationId: number): Promise<TranslationHistory[]>;

  getCacheTags(options?: CacheTagQueryOptions): Promise<CacheTagSummary[]>;
  deleteCacheTag(id: number, options?: CacheTagDeletionOptions): Promise<void>;
  updateTranslationCacheTag(translationId: number, cacheTagId: number): Promise<void>;

  // 번역 내보내기/가져오기 관련 메서드
  exportTranslations(searchParams: CacheSearchParams): Promise<TranslationExportImport[]>;
  importTranslations(translations: TranslationExportImport[]): Promise<number>;
}

export const ICacheManagerService = Symbol('ICacheManagerService');
