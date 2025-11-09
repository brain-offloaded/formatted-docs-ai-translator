import { IpcChannel } from '@/ipc/ipc-channel';
import type { IpcRequest as ChannelRequest, IpcResponse as ChannelResponse } from '@/ipc/ipc.types';

export type IpcRequest<T extends IpcChannel> = ChannelRequest<T>;
export type IpcResponse<T extends IpcChannel> = ChannelResponse<T>;

type invokeFunctionType = {
  <T extends IpcChannel>(
    channel: T,
    ...args: IpcRequest<T> extends never | void ? [] : [request: IpcRequest<T>]
  ): Promise<IpcResponse<T>>;
};

export type InvokeFunctionRequest<T extends IpcChannel> = IpcRequest<T>;
export type InvokeFunctionResponse<T extends IpcChannel> = IpcResponse<T>;

interface IpcRenderer {
  invoke: invokeFunctionType;

  on: (channel: string, func: (...args: unknown[]) => void) => () => void;
}

interface ElectronAPI {
  ipcRenderer: IpcRenderer;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
