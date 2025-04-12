import { IpcChannel } from '../nest/common/ipc.channel';
import { ParserRequestResponse } from '@/nest/parser/dto';
import { CacheRequestResponse } from '@/nest/cache/dto';
import { TranslatorRequestResponse } from '@/nest/translation/translator/dto';
import { ExamplePresetRequestResponse } from '@/nest/translation/example/dto';
import { LoggerRequestResponse } from '@/nest/logger/dto';
import { UpdaterRequestResponse } from '@/nest/common/updater/dto';
import { DbRequestResponse } from '@/nest/db/dto';
import { CommonRequestResponse } from '@/nest/common/dto';
type IpcRequestResponse = ParserRequestResponse &
  CacheRequestResponse &
  TranslatorRequestResponse &
  ExamplePresetRequestResponse &
  LoggerRequestResponse &
  UpdaterRequestResponse &
  DbRequestResponse &
  CommonRequestResponse;

type invokeFunctionType = {
  <T extends IpcChannel>(
    channel: T,
    ...args: IpcRequestResponse[T]['Request'] extends never
      ? []
      : [request: IpcRequestResponse[T]['Request']]
  ): Promise<IpcRequestResponse[T]['Response']>;
};

export type InvokeFunctionRequest<T extends IpcChannel> = IpcRequestResponse[T]['Request'];
export type InvokeFunctionResponse<T extends IpcChannel> = IpcRequestResponse[T]['Response'];

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
