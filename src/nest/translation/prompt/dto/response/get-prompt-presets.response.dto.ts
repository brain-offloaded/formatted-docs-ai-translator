import { BaseResponseDto } from '../../../../../types/ipc/base-response';
import { PromptPresetDto } from '../prompt-preset.dto';

export class GetPromptPresetsResponseDto extends BaseResponseDto {
  presets: PromptPresetDto[];
}
