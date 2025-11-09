import type { OpenZipInAdvancedViewerDialogResponse } from '@/ipc/ipc.types';
import { BaseResponseType } from '@/ipc/dto/base-response-type';

export class OpenZipInAdvancedViewerDialogResponseDto
  extends BaseResponseType
  implements OpenZipInAdvancedViewerDialogResponse
{
  selectedPath?: string;
}
