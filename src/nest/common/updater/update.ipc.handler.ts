import { Injectable } from '@nestjs/common';
import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';

import { IpcHandler, HandleIpc } from '../ipc.handler';
import { InvokeFunctionResponse } from '../../../types/electron';
import { IpcChannel } from '../ipc.channel';
import { LoggerService } from '../../logger/logger.service';
import { errorToString } from '../../../utils/error-stringify';

@Injectable()
export class UpdateIpcHandler extends IpcHandler {
  constructor(private readonly logger: LoggerService) {
    super();
    this.setupAutoUpdater();
  }

  private setupAutoUpdater() {
    // 자동 업데이트 로그 설정
    autoUpdater.logger = this.logger;
    autoUpdater.allowDowngrade = false;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // 업데이트 이벤트 리스너 설정
    autoUpdater.on('checking-for-update', () => {
      this.sendStatusToWindow('업데이트 확인 중...');
    });

    autoUpdater.on('update-available', (info) => {
      this.sendStatusToWindow('업데이트_가능', info);
    });

    autoUpdater.on('update-not-available', (info) => {
      this.sendStatusToWindow('업데이트_없음', info);
    });

    autoUpdater.on('error', (err) => {
      this.sendStatusToWindow('업데이트_오류', err.toString());
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.sendStatusToWindow('다운로드_진행', progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.sendStatusToWindow('업데이트_다운로드_완료', info);
    });
  }

  private sendStatusToWindow(status: string, data?: unknown) {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { status, data });
    }
  }

  @HandleIpc(IpcChannel.CheckForUpdates)
  async checkForUpdates(): Promise<InvokeFunctionResponse<IpcChannel.CheckForUpdates>> {
    try {
      return await autoUpdater.checkForUpdates();
    } catch (error) {
      this.logger.error('업데이트 확인 중 오류 발생:', { error: errorToString(error) });
      throw error;
    }
  }

  @HandleIpc(IpcChannel.DownloadUpdate)
  async downloadUpdate(): Promise<InvokeFunctionResponse<IpcChannel.DownloadUpdate>> {
    try {
      return await autoUpdater.downloadUpdate();
    } catch (error) {
      this.logger.error('업데이트 다운로드 중 오류 발생:', { error: errorToString(error) });
      throw error;
    }
  }

  @HandleIpc(IpcChannel.QuitAndInstall)
  async quitAndInstall(): Promise<InvokeFunctionResponse<IpcChannel.QuitAndInstall>> {
    autoUpdater.quitAndInstall(false, true);
    return;
  }

  @HandleIpc(IpcChannel.GetCurrentVersion)
  getCurrentVersion(): InvokeFunctionResponse<IpcChannel.GetCurrentVersion> {
    return app.getVersion();
  }
}
