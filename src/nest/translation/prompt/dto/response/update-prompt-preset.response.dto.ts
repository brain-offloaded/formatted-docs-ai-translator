import { BaseResponseDto } from '../../../../../types/ipc/base-response';
import { PromptPresetDto } from '../prompt-preset.dto';

export class UpdatePromptPresetResponseDto extends BaseResponseDto {
  preset?: PromptPresetDto; // 업데이트 실패 시 없을 수 있으므로 optional
}
