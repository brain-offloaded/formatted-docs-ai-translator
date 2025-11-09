import { Module } from '@nestjs/common';

import { PromptPresetManagerService } from './services/prompt-preset-manager.service';
import { PromptPresetController } from './prompt-preset.controller';
import { LoggerModule } from '../../logger/logger.module';
import { DbModule } from '../../db/db.module';

@Module({
  imports: [DbModule, LoggerModule],
  controllers: [PromptPresetController],
  providers: [PromptPresetManagerService],
  exports: [PromptPresetManagerService], // 필요시 서비스 export
})
export class PromptPresetModule {}
