import { BaseResponseDto } from '../../../../../types/ipc/base-response';
import { PromptPresetDto } from '../prompt-preset.dto';

export class CreatePromptPresetResponseDto extends BaseResponseDto {
  preset?: PromptPresetDto; // 생성 실패 시 없을 수 있으므로 optional
}
