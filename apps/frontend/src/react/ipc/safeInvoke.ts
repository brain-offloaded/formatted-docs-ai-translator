import { IpcChannel } from '@apps/common/dist/ipc/ipc-channel';
import { IpcRequest, IpcResponse } from '@apps/common/dist/types/electron';

interface SafeInvokeResult<T extends IpcChannel> {
  data: IpcResponse<T> | null;
  error: Error | null;
}

export async function safeIpcInvoke<T extends IpcChannel>(
  channel: T,
  payload?: IpcRequest<T>
): Promise<SafeInvokeResult<T>> {
  const invoke = resolveIpcInvoke();
  if (!invoke) {
    const error = new Error('Electron IPC renderer is not available in the current environment.');
    console.error(`[IPC] invoke failed on channel "${channel}":`, error);
    return { data: null, error };
  }

  try {
    const data = await invoke(channel, payload);
    return { data, error: null };
  } catch (rawError) {
    const error =
      rawError instanceof Error
        ? rawError
        : new Error(typeof rawError === 'string' ? rawError : 'Unknown IPC error');
    console.error(`[IPC] invoke failed on channel "${channel}":`, error);
    return { data: null, error };
  }
}

function resolveIpcInvoke():
  | (<T extends IpcChannel>(channel: T, payload?: IpcRequest<T>) => Promise<IpcResponse<T>>)
  | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const possibleRenderer = (
    window as typeof window & {
      electron?: { ipcRenderer?: { invoke?: (...args: unknown[]) => Promise<unknown> } };
    }
  ).electron?.ipcRenderer;

  if (!possibleRenderer || typeof possibleRenderer.invoke !== 'function') {
    return null;
  }

  return possibleRenderer.invoke.bind(possibleRenderer);
}
