export type Mode = 'applied' | 'original-text';

export interface PageItem {
  key: string;
  originalUrl: string | null;
  appliedUrl: string | null;
  texts: string[];
}

export interface ImageLoadState {
  isLoading: boolean;
  hasError: boolean;
  progress: number;
}
