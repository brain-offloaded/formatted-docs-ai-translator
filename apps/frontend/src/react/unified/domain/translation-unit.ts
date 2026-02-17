export interface TranslationUnit {
  key: string;
  source: string;
  target?: string;
  strictFailed?: boolean;
  strictFailureReasons?: string[];
}
