import { Module } from '@nestjs/common';
import { TempWorkspaceService } from './temp-workspace.service';
import { TempWorkspaceController } from './temp-workspace.controller';
import { LoggerModule } from '@/nest/logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [TempWorkspaceController],
  providers: [TempWorkspaceService],
  exports: [TempWorkspaceService],
})
export class TempWorkspaceModule {}
