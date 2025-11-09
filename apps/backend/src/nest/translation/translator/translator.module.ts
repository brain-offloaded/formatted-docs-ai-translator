import { Module } from '@nestjs/common';

import { TranslatorService } from './services/translator.service';
import { AiModule } from '../../ai/ai.module';
import { TextTranslatorController } from './text-translator.controller';

@Module({
  imports: [AiModule],
  controllers: [TextTranslatorController],
  providers: [TranslatorService],
  exports: [TranslatorService],
})
export class TranslatorModule {}
