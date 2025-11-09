import type { AdvancedViewerLoadZipRequest } from '@/ipc/ipc.types';

export class AdvancedViewerLoadZipRequestDto implements AdvancedViewerLoadZipRequest {
  zipBuffer?: ArrayBuffer;
  zipBase64?: string;
  zipPath?: string;
  name?: string;
  windowId?: number;
}
