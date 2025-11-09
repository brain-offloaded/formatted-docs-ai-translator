export interface TranslationHistory {
  source: string;
  target: string;
  success: boolean;
  error?: string | null;
  model: string;
  createdAt: string;
  cacheTag: string;
}

export interface CacheTranslation {
  id: number;
  source: string;
  target: string;
  createdAt: string;
  lastAccessedAt: string;
  cacheTag: string;
  cacheTagId: number | null;
  fileName?: string | null;
  filePath?: string | null;
}

interface CacheTagLike {
  id: number;
  name: string;
}

export interface CacheTagSummary {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  translationCount: number;
}

export interface TranslationData {
  id: number;
  source: string;
  target: string;
  success: boolean;
  createdAt: Date;
  lastAccessedAt: Date;
  cacheTag: CacheTagLike;
}

export interface TranslationHistoryData {
  id: number;
  translationId: number;
  source: string;
  target: string;
  success: boolean;
  error: string | null;
  model: string;
  createdAt: Date;
  cacheTag: CacheTagLike;
}

export interface TranslationExportImport {
  id: number;
  source: string;
  target: string;
  cacheTag: string;
}

export interface TranslationBasicInfo {
  id: number;
  source: string;
  cacheTag: string;
  cacheTagId: number | null;
}

export type CacheTagDeletionMode = 'strict' | 'cascade' | 'reassign';

export interface CacheTagDeletionOptions {
  mode?: CacheTagDeletionMode;
  targetTagId?: number;
}
