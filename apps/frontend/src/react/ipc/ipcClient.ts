import { IpcChannel } from '@apps/common/dist/ipc/ipc-channel';
import { IpcRequest, IpcResponse } from '@apps/common/dist/types/electron';

type IpcRendererAPI = Window['electron']['ipcRenderer'] | undefined;

const resolveRenderer = (): NonNullable<IpcRendererAPI> => {
  if (typeof window === 'undefined') {
    throw new Error('IPC renderer는 브라우저 환경에서만 사용할 수 있습니다.');
  }

  const renderer = window.electron?.ipcRenderer;
  if (!renderer) {
    throw new Error('IPC renderer가 초기화되지 않았습니다.');
  }

  return renderer;
};

async function invoke<T extends IpcChannel>(
  channel: T,
  payload: IpcRequest<T>
): Promise<IpcResponse<T>>;
async function invoke<T extends IpcChannel>(channel: T): Promise<IpcResponse<T>>;
async function invoke<T extends IpcChannel>(
  channel: T,
  payload?: IpcRequest<T>
): Promise<IpcResponse<T>> {
  const renderer = resolveRenderer();

  try {
    const args = typeof payload === 'undefined' ? [channel] : [channel, payload as IpcRequest<T>];
    const invokeFn = renderer.invoke as (...invokeArgs: unknown[]) => Promise<unknown>;
    return (await invokeFn(...args)) as IpcResponse<T>;
  } catch (error) {
    console.error(`[IPC] invoke 실패 - 채널: ${channel}`, error);
    throw error;
  }
}

const subscribe = <T extends IpcChannel>(
  channel: T,
  listener: (payload: IpcResponse<T>) => void
): (() => void) => {
  const renderer = resolveRenderer();

  return renderer.on(channel, (...args: unknown[]) => {
    // preload에서 이벤트 payload만 전달하므로 첫 번째 값 사용
    const [payload] = args as [IpcResponse<T>];
    listener(payload);
  });
};

export const ipcClient = {
  invoke,
  subscribe,
};
