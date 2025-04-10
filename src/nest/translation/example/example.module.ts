import { Module } from '@nestjs/common';

import { ExampleManagerService } from './services/example-manager.service';
import { TypeOrmDbModule } from '../../../nest/db/typeorm/typeorm.module';
import { ExamplePresetIpcHandler } from './example-preset.ipc.handler';
import { LoggerModule } from '../../logger/logger.module';

@Module({
  imports: [TypeOrmDbModule, LoggerModule],
  providers: [ExampleManagerService, ExamplePresetIpcHandler],
  exports: [ExampleManagerService],
})
export class ExampleModule {}
