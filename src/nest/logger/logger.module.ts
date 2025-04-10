import { Module, Global } from '@nestjs/common';

import { DbModule } from '../db/db.module';

import { LoggerIpcHandler } from './logger.ipc.handler';
import { LoggerService } from './logger.service';

@Global()
@Module({
  imports: [DbModule],
  providers: [LoggerService, LoggerIpcHandler],
  exports: [LoggerService],
})
export class LoggerModule {}
