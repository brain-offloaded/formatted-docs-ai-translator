import { ExamplePresetDto } from '@/nest/translation/example/dto/example-preset.dto';

export class GetExamplePresetsResponseDto {
  success: boolean;
  message: string;
  presets: ExamplePresetDto[];
  currentPreset: string;
}
