export interface CacheSearchParams {
  searchType: 'source' | 'target' | 'fileName' | 'filePath' | 'date';
  searchValue: string;
  startDate: string;
  endDate: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TextPath<TExtra = any> {
  text: string;
  path: string;
  extra?: TExtra;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TranslatedTextPath<TExtra = any> extends TextPath<TExtra> {
  translatedText: string;
}
