import { TranslatorAiSettings } from '@/nest/translator/common/dto/translator-settings.dto';

export interface TranslationProgressEvent {
  completed: number;
  total: number;
}

export interface PlaceholderPreservationRule {
  pattern: string;
  flags?: string;
  enabled?: boolean;
}

export interface PlaceholderPreservationSettings {
  enabled: boolean;
  rules: PlaceholderPreservationRule[];
}

export type StrictFailureReason = 'placeholder_mismatch' | 'unresolved_segment';

export interface TextSegmentStrictMeta {
  strictFailed: boolean;
  strictFailureReasons: StrictFailureReason[];
  strictFailureCount: number;
}

export interface TextTranslateResult {
  texts: string[];
  strictMetaByIndex: TextSegmentStrictMeta[];
}

export interface TextTranslateParam {
  requestId: string;
  sourceTexts: string[];
  promptPresetContent: string;
  aiSettings: TranslatorAiSettings;
  cacheTag: string;
  placeholderPreservation?: PlaceholderPreservationSettings;
  onProgress?: (event: TranslationProgressEvent) => void;
}

export interface ImageTranslateParam {
  requestId: string;
  fileName?: string;
  imageData: string; // base64 encoded image data
  promptPresetContent: string;
  aiSettings: TranslatorAiSettings;
  cacheTag?: string;
}

export type TranslateParam = TextTranslateParam | ImageTranslateParam;
