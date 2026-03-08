export interface FileState {
  selectedFiles: File[] | null;
}

export enum TranslationType {
  Text = 'text',
  Json = 'json',
  Csv = 'csv',
  Subtitle = 'subtitle',
  Image = 'image',
}

export interface TranslationResultState {
  translationResult: {
    text: string;
    isError: boolean;
  } | null;
  report?: {
    total: number;
    success: number;
    fail: number;
    successRate: number;
    isError?: boolean;
    errorMessage?: string;
    totalSize?: number;
    processingTime?: number;
    items: {
      name: string;
      success: boolean;
      errorMessage?: string;
      fileSize?: number;
      processingTime?: number;
    }[];
  } | null;
  imageResult?: (string | null)[] | null;
  zipBlob: Blob | null;
  singleFileBlob: Blob | null;
  singleFileName: string | null;
}

export interface UIState {
  copied: boolean;
  snackbarOpen: boolean;
  snackbarMessage: string;
  translationProgress: number;
  currentFileIndex: number;
  showJsonSettings: boolean;
  progressMessage: string;
  completed: number;
  totalJobs: number;
  failed: number;
  cancelled: number;
}
