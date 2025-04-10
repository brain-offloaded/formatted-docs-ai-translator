import { IpcChannel } from '@/nest/common/ipc.channel';

export class DbRequestResponse {
  [IpcChannel.GetDbPath]: {
    Request: never;
    Response: string;
  };
}
