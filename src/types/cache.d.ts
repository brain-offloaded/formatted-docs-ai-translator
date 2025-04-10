export interface TranslationHistory {
  source: string;
  target: string;
  success: boolean;
  error?: string | null;
  model: string;
  createdAt: string;
}

export interface CacheTranslation {
  id: number;
  source: string;
  target: string;
  fileName: string | null;
  filePath: string | null;
  createdAt: string;
  lastAccessedAt: string;
}

export interface FilePathInfo {
  fileName: string;
  filePath: string;
}

export interface TranslationData {
  id: number;
  source: string;
  target: string;
  success: boolean;
  fileInfo?: FilePathInfo | null;
  createdAt: Date;
  lastAccessedAt: Date;
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
}

export interface TranslationExportImport {
  id: number;
  source: string;
  target: string;
}

export interface TranslationBasicInfo {
  id: number;
  source: string;
}
