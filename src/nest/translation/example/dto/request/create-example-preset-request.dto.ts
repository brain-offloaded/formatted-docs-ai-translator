import { SourceLanguage } from '@/utils/language';

export class CreateExamplePresetRequestDto {
  name: string;
  description: string | null;
  examples?: Record<SourceLanguage, { sourceLines: string[]; resultLines: string[] }>;
}
