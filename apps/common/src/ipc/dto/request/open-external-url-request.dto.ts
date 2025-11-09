import type { OpenExternalUrlRequest } from '@/ipc/ipc.types';

export class OpenExternalUrlRequestDto implements OpenExternalUrlRequest {
  url: string;
}
