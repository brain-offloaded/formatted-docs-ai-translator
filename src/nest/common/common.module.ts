import { Module } from '@nestjs/common';
import { CommonIpcHandler } from './common.ipc.handler';
import { UpdateModule } from './updater/update.module';

@Module({
  imports: [UpdateModule],
  providers: [CommonIpcHandler],
  exports: [CommonIpcHandler],
})
export class CommonModule {}
