import { ExamplePresetDetailDto } from '@/nest/translation/example/dto/example-preset-detail.dto';

export class GetExamplePresetDetailResponseDto {
  success: boolean;
  message: string;
  preset?: ExamplePresetDetailDto;
}
