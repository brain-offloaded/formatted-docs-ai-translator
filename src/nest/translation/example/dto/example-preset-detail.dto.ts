import { SourceLanguage } from '@/utils/language';
import { ExamplePresetDto } from './example-preset.dto';

export class ExamplePresetDetailDto extends ExamplePresetDto {
  examples: Record<SourceLanguage, { sourceLines: string[]; resultLines: string[] }>;
}
