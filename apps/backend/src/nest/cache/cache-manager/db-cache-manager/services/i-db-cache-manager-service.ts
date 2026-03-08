import type { Prisma } from '@prisma/client';

import type { TransactionContext } from '@/nest/common/transaction/unit-of-work.service';

import {
  TranslationHistory,
  TranslationData,
  CacheTranslation,
  TranslationBasicInfo,
  CacheTagSummary,
  CacheTagDeletionOptions,
} from '@apps/common/dist/types/cache';
import { CacheSearchParams } from '@apps/common/dist/types/common';

export interface CacheTagQueryOptions {
  keyword?: string;
  sortBy?: 'lastUsedAt' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * DB 캐시 관리 인터페이스
 * SqliteCacheManager 클래스가 구현하는 인터페이스입니다.
 */
export interface IDbCacheManagerService {
  // 기본 캐시 조작 메서드
  getTranslation(text: string, cacheTag: string): Promise<string | null>;
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

  // 이력 관련 메서드
  addTranslationHistory(history: TranslationHistory): Promise<void>;
  getTranslationHistory(source: string, cacheTag: string): Promise<TranslationHistory[]>;
  clear(): Promise<void>;

  // DB 직접 액세스 메서드
  findTranslationById(
    id: number
  ): Promise<{ source: string; target: string; cacheTag: string } | null>;
  updateTranslationInDb(
    id: number,
    translation: string,
    transactionClient?: Prisma.TransactionClient,
    transactionContext?: TransactionContext
  ): Promise<{ source: string; target: string; cacheTag: string } | null>;
  findTranslationsByIds(ids: number[]): Promise<TranslationBasicInfo[]>;
  deleteTranslationsByIds(ids: number[]): Promise<void>;
  findTranslationsByCondition(where: Prisma.TranslationWhereInput): Promise<TranslationBasicInfo[]>;
  countTranslations(where: Prisma.TranslationWhereInput): Promise<number>;
  findTranslationsWithPagination(
    where: Prisma.TranslationWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.TranslationOrderByWithRelationInput
  ): Promise<TranslationData[]>;
  findTranslationHistoryById(
    translationId: number
  ): Promise<Array<TranslationHistory & { translationId: number }>>;

  // searchParams 관련 메서드
  buildWhereFromSearchParams(searchParams: CacheSearchParams): Prisma.TranslationWhereInput;

  getTranslationsBySearchParams(
    page: number,
    itemsPerPage: number,
    searchParams: CacheSearchParams
  ): Promise<{
    translations: CacheTranslation[];
    totalItems: number;
  }>;

  getAllCacheTags(options?: CacheTagQueryOptions): Promise<CacheTagSummary[]>;
  findCacheTagById(id: number): Promise<CacheTagSummary | null>;
  deleteCacheTag(id: number, options?: CacheTagDeletionOptions): Promise<void>;
  updateTranslationCacheTag(translationId: number, cacheTagId: number): Promise<void>;
}

export const IDbCacheManagerService = Symbol('IDbCacheManagerService');
