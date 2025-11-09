import type { BaseIpcResponse } from '@/ipc/ipc.types';

export class BaseResponseType implements BaseIpcResponse {
  success: boolean;
  message?: string;
}
