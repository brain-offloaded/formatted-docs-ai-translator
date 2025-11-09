import { Module } from '@nestjs/common';

import { ExampleManagerService } from './services/example-manager.service';
import { DbModule } from '../../../nest/db/db.module';
import { LoggerModule } from '../../logger/logger.module';
import { ExamplePresetController } from './example-preset.controller';

@Module({
  imports: [DbModule, LoggerModule],
  controllers: [ExamplePresetController],
  providers: [ExampleManagerService],
  exports: [ExampleManagerService],
})
export class ExampleModule {}
