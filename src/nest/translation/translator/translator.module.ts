import { Module } from '@nestjs/common';

import { TranslatorIpcHandler } from './translator.ipc.handler';
import { TranslatorService } from './services/translator.service';
import { AiModule } from '../../ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [TranslatorService, TranslatorIpcHandler],
  exports: [TranslatorService, TranslatorIpcHandler],
})
export class TranslatorModule {}
