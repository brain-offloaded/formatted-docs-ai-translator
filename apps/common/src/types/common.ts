export enum CacheSearchType {
  SOURCE = 'source',
  TARGET = 'target',
  FILE_NAME = 'fileName',
  FILE_PATH = 'filePath',
  DATE = 'date',
  CACHE_TAG = 'cacheTag',
}

export interface CacheSearchParams {
  searchType: CacheSearchType;
  searchValue: string;
  startDate: string;
  endDate: string;
}

export class TextPath<TExtra> {
  text: string;
  path: string;
  extra?: TExtra;
}

export class SimpleTextPath extends TextPath<never> {}

export class TranslatedTextPath<TExtra> extends TextPath<TExtra> {
  translatedText: string;
}

export class SimpleTranslatedTextPath extends TranslatedTextPath<never> {}
