import { Injectable } from '@nestjs/common';
import { shell } from 'electron';
import { LoggerService } from '../logger/logger.service';
import { HandleIpc, IpcHandler } from './ipc.handler';
import { IpcChannel } from './ipc.channel';
import { errorToString } from '@/utils/error-stringify';
import { InvokeFunctionRequest, InvokeFunctionResponse } from '@/types/electron';

@Injectable()
export class CommonIpcHandler extends IpcHandler {
  constructor(protected readonly logger: LoggerService) {
    super();
  }

  @HandleIpc(IpcChannel.OpenExternalUrl)
  async openExternalUrl(
    event: Electron.IpcMainInvokeEvent,
    { url }: InvokeFunctionRequest<IpcChannel.OpenExternalUrl>
  ): Promise<InvokeFunctionResponse<IpcChannel.OpenExternalUrl>> {
    try {
      await shell.openExternal(url);
      return { success: true, message: '외부 URL 열기 성공' };
    } catch (error) {
      this.logger.error('외부 URL 열기 실패:', { url, error: errorToString(error) });
      return { success: false, message: errorToString(error) };
    }
  }
}
