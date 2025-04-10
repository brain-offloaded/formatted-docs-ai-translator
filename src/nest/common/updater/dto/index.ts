import { UpdateCheckResult } from 'electron-updater';
import { IpcChannel } from '../../ipc.channel';

export class UpdaterRequestResponse {
  [IpcChannel.CheckForUpdates]: {
    Request: never;
    Response: UpdateCheckResult | null;
  };
  [IpcChannel.QuitAndInstall]: {
    Request: never;
    Response: void;
  };
  [IpcChannel.GetCurrentVersion]: {
    Request: never;
    Response: string;
  };
  [IpcChannel.DownloadUpdate]: {
    Request: never;
    Response: string[];
  };
}
