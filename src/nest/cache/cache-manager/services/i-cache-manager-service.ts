import {
  TranslationHistory,
  CacheTranslation,
  FilePathInfo,
  TranslationExportImport,
} from '@/types/cache';
import { CacheSearchParams } from '@/types/common';

/**
 * 캐시 관리 최상위 인터페이스
 * CacheManagerService 클래스가 구현하는 인터페이스입니다.
 */
export interface ICacheManagerService {
  getTranslation(text: string): Promise<string | null>;
  setTranslation(
    text: string,
    translation: string,
    success?: boolean,
    fileInfo?: FilePathInfo,
    modelName?: string
  ): Promise<void>;
  getTranslations(texts: string[]): Promise<Map<string, string | null>>;
  setTranslations(
    translations: Map<string, string>,
    success?: boolean,
    fileInfo?: FilePathInfo,
    modelName?: string
  ): Promise<void>;
  addTranslationHistory(history: TranslationHistory): Promise<void>;
  getTranslationHistory(source: string): Promise<TranslationHistory[]>;
  clear(): Promise<void>;

  // 캐시 관리 관련 메서드
  invalidateMemoryCache(text: string): Promise<void>;
  invalidateMemoryCacheMany(texts: string[]): Promise<void>;
  updateTranslation(id: number, translation: string, source?: string): Promise<void>;
  deleteTranslations(ids: number[]): Promise<void>;
  deleteAllTranslations(searchParams: CacheSearchParams): Promise<void>;

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

  // 번역 내보내기/가져오기 관련 메서드
  exportTranslations(searchParams: CacheSearchParams): Promise<TranslationExportImport[]>;
  importTranslations(translations: TranslationExportImport[]): Promise<number>;
}

export const ICacheManagerService = Symbol('ICacheManagerService');
