import { Module } from '@nestjs/common';

import { ModelPresetManagerService } from './services/model-preset-manager.service';
import { ModelPresetController } from './model-preset.controller';
import { LoggerModule } from '../../logger/logger.module';
import { DbModule } from '../../db/db.module';

@Module({
  imports: [DbModule, LoggerModule],
  controllers: [ModelPresetController],
  providers: [ModelPresetManagerService],
  exports: [ModelPresetManagerService],
})
export class ModelPresetModule {}
