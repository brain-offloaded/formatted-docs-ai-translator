import { Injectable } from '@nestjs/common';
import { IpcMainInvokeEvent } from 'electron';

import { InvokeFunctionRequest, InvokeFunctionResponse } from '../../types/electron';
import { IpcHandler, HandleIpc } from '../common/ipc.handler';
import { IpcChannel } from '../common/ipc.channel';

import { LoggerService } from './logger.service';

@Injectable()
export class LoggerIpcHandler extends IpcHandler {
  constructor(protected readonly logger: LoggerService) {
    super();
  }

  @HandleIpc(IpcChannel.GetLogs)
  async getLogs(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.GetLogs>
  ): Promise<InvokeFunctionResponse<IpcChannel.GetLogs>> {
    try {
      return await this.logger.getLogs(request);
    } catch (error) {
      this.logger.error('로그를 조회하는 중 오류가 발생했습니다:', { error });
      throw error;
    }
  }

  @HandleIpc(IpcChannel.DeleteLogs)
  async deleteLogs(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.DeleteLogs>
  ): Promise<InvokeFunctionResponse<IpcChannel.DeleteLogs>> {
    try {
      await this.logger.deleteLogs(request.logIds);
      return { success: true, message: '로그가 삭제되었습니다.' };
    } catch (error) {
      this.logger.error('로그를 삭제하는 중 오류가 발생했습니다:', { error });
      throw error;
    }
  }

  @HandleIpc(IpcChannel.DeleteAllLogs)
  async deleteAllLogs(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.DeleteAllLogs>
  ): Promise<InvokeFunctionResponse<IpcChannel.DeleteAllLogs>> {
    try {
      await this.logger.deleteAllLogs(request.searchParams);
      return { success: true, message: '모든 로그가 삭제되었습니다.' };
    } catch (error) {
      this.logger.error('모든 로그를 삭제하는 중 오류가 발생했습니다:', { error });
      throw error;
    }
  }
}
