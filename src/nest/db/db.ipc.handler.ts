import { Injectable } from '@nestjs/common';

import { IpcHandler, HandleIpc } from '../common/ipc.handler';
import { IpcChannel } from '../common/ipc.channel';

import { DbService } from './services/db.service';
import { InvokeFunctionResponse } from '../../types/electron';

@Injectable()
export class DbIpcHandler extends IpcHandler {
  constructor(private readonly dbService: DbService) {
    super();
  }

  @HandleIpc(IpcChannel.GetDbPath)
  async getDbPath(): Promise<InvokeFunctionResponse<IpcChannel.GetDbPath>> {
    return this.dbService.getDbPath();
  }
}
