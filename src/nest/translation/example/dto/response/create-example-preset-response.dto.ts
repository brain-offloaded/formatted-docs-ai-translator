import { ExamplePresetDto } from '@/nest/translation/example/dto/example-preset.dto';

export class CreateExamplePresetResponseDto {
  success: boolean;
  message: string;
  preset?: ExamplePresetDto;
}
