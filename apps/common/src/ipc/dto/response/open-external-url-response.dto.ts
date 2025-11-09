import type { OpenExternalUrlResponse } from '@/ipc/ipc.types';
import { BaseResponseType } from '@/ipc/dto/base-response-type';

export class OpenExternalUrlResponseDto
  extends BaseResponseType
  implements OpenExternalUrlResponse {}
