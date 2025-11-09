import type { OpenAdvancedViewerResponse } from '@/ipc/ipc.types';
import { BaseResponseType } from '@/ipc/dto/base-response-type';

export class OpenAdvancedViewerResponseDto
  extends BaseResponseType
  implements OpenAdvancedViewerResponse
{
  windowId?: number;
}
