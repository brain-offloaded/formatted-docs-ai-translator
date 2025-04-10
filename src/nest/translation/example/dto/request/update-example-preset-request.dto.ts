import { SourceLanguage } from '@/utils/language';

export class UpdateExamplePresetRequestDto {
  id: number;
  examples: Record<SourceLanguage, { sourceLines: string[]; resultLines: string[] }>;
  description?: string | null;
  name?: string;
}
