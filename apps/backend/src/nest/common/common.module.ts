import { Module } from '@nestjs/common';
import { CommonIpcHandler } from './common.ipc.handler';
import { TempWorkspaceModule } from '../cache/temp-workspace/temp-workspace.module';

@Module({
  imports: [TempWorkspaceModule],
  providers: [CommonIpcHandler],
  exports: [CommonIpcHandler],
})
export class CommonModule {}
