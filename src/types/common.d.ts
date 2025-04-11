export interface CacheSearchParams {
  searchType: 'source' | 'target' | 'fileName' | 'filePath' | 'date';
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
