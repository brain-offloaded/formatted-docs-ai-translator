import { SourceLanguage } from '../../../../utils/language';
import { FilePathInfo } from '@/types/cache';

export interface AiTranslateParam {
  sourceTexts: string[];
  sourceLanguage: SourceLanguage;
  fileInfo?: FilePathInfo;
  maxOutputTokenCount: number;
  requestsPerMinute: number;
  apiKey: string;
  promptPresetContent: string;
  useThinking: boolean;
}
