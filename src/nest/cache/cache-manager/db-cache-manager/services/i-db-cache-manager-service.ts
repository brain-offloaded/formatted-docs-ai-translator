import { FindOptionsWhere } from 'typeorm';

import { Translation } from '../../../../db/typeorm/entities';
import {
  FilePathInfo,
  TranslationHistory,
  TranslationData,
  CacheTranslation,
  TranslationBasicInfo,
} from '@/types/cache';
import { CacheSearchParams } from '@/types/common';

/**
 * DB 캐시 관리 인터페이스
 * SqliteCacheManager 클래스가 구현하는 인터페이스입니다.
 */
export interface IDbCacheManagerService {
  // 기본 캐시 조작 메서드
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

  // 이력 관련 메서드
  addTranslationHistory(history: TranslationHistory): Promise<void>;
  getTranslationHistory(source: string): Promise<TranslationHistory[]>;
  clear(): Promise<void>;

  // DB 직접 액세스 메서드
  findTranslationById(id: number): Promise<{ source: string; target: string } | null>;
  updateTranslationInDb(id: number, translation: string): Promise<void>;
  findTranslationsByIds(ids: number[]): Promise<TranslationBasicInfo[]>;
  deleteTranslationsByIds(ids: number[]): Promise<void>;
  findTranslationsByCondition(
    where: FindOptionsWhere<Translation>
  ): Promise<TranslationBasicInfo[]>;
  countTranslations(where: FindOptionsWhere<Translation>): Promise<number>;
  findTranslationsWithPagination(
    where: FindOptionsWhere<Translation>,
    skip: number,
    take: number,
    orderBy: Record<string, 'ASC' | 'DESC'>
  ): Promise<TranslationData[]>;
  findTranslationHistoryById(
    translationId: number
  ): Promise<Array<TranslationHistory & { translationId: number }>>;

  // searchParams 관련 메서드
  buildWhereFromSearchParams(searchParams: CacheSearchParams): FindOptionsWhere<Translation>;

  getTranslationsBySearchParams(
    page: number,
    itemsPerPage: number,
    searchParams: CacheSearchParams
  ): Promise<{
    translations: CacheTranslation[];
    totalItems: number;
  }>;

  deleteTranslationsByIds(ids: number[]): Promise<void>;
}

export const IDbCacheManagerService = Symbol('IDbCacheManagerService');
