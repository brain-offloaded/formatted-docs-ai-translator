import { Module } from '@nestjs/common';
import { UnifiedAiTranslatorService } from './services/unified-ai-translator.service';
import { GeminiModule } from './gemini/gemini.module';

@Module({
  imports: [GeminiModule],
  providers: [UnifiedAiTranslatorService],
  exports: [UnifiedAiTranslatorService],
})
export class AiModule {}
