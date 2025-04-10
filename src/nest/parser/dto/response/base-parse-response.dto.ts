import { TextPath } from '@/types/common';
import { BaseResponseDto } from '@/types/ipc/base-response';

export class BaseParseResponseDto extends BaseResponseDto {
  targets: TextPath[];
}
