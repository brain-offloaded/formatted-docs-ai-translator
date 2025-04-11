import { TextPath } from '@/types/common';
import { BaseResponseDto } from '@/types/ipc/base-response';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class BaseParseResponseDto<TExtra = any> extends BaseResponseDto {
  targets: TextPath<TExtra>[];
}
