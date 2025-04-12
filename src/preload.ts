import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannel } from './nest/common/ipc.channel';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) => {
      if (Object.values(IpcChannel).includes(channel as IpcChannel)) {
        return ipcRenderer.invoke(channel, ...args);
      }

      throw new Error(`IPC 채널 "${channel}"은(는) 허용되지 않습니다.`);
    },
    on: (channel: string, func: (...args: unknown[]) => void) => {
      if (Object.values(IpcChannel).includes(channel as IpcChannel)) {
        const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
          func(...args);
        ipcRenderer.on(channel, subscription);
        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      }

      throw new Error(`IPC 채널 "${channel}"은(는) 허용되지 않습니다.`);
    },
  },
});
