import { Module } from '@nestjs/common';

import { UpdateIpcHandler } from './update.ipc.handler';

@Module({
  providers: [UpdateIpcHandler],
  exports: [],
})
export class UpdateModule {}
