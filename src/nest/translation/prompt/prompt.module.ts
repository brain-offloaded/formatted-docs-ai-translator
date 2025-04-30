import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // TypeOrmModule 직접 import

import { PromptPresetManagerService } from './services/prompt-preset-manager.service';
import { PromptPresetIpcHandler } from './prompt-preset.ipc.handler';
import { LoggerModule } from '../../logger/logger.module';
import { PromptPreset } from '../../db/typeorm/entities/prompt-preset.entity'; // 엔티티 import

@Module({
  imports: [
    TypeOrmModule.forFeature([PromptPreset]), // PromptPreset 엔티티 등록
    LoggerModule,
  ],
  providers: [PromptPresetManagerService, PromptPresetIpcHandler],
  exports: [PromptPresetManagerService], // 필요시 서비스 export
})
export class PromptPresetModule {}
