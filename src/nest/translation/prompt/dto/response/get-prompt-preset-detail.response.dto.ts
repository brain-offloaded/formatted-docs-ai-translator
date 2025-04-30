import { BaseResponseDto } from '../../../../../types/ipc/base-response';
import { PromptPresetDetailDto } from '../prompt-preset-detail.dto';

export class GetPromptPresetDetailResponseDto extends BaseResponseDto {
  preset?: PromptPresetDetailDto; // 프리셋이 없을 수도 있으므로 optional
}
