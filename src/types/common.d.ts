export interface CacheSearchParams {
  searchType: 'source' | 'target' | 'fileName' | 'filePath' | 'date';
  searchValue: string;
  startDate: string;
  endDate: string;
}

export interface TextPath {
  text: string;
  path: string;
}

export interface TranslatedTextPath extends TextPath {
  translatedText: string;
}
