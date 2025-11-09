import type { AdvancedViewerLoadZipResponse } from '@/ipc/ipc.types';
import { BaseResponseType } from '@/ipc/dto/base-response-type';

export class AdvancedViewerLoadZipResponseDto
  extends BaseResponseType
  implements AdvancedViewerLoadZipResponse {}
