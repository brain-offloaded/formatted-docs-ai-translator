import { Module } from '@nestjs/common';
import { UnifiedAiTranslatorService } from './common/services/unified-ai-translator.service';
import { ExampleModule } from '../translation/example/example.module';
import { CacheManagerModule } from '../cache/cache-manager/cache-manager.module';
import { AiTokenService } from './common/services/ai-token.service';
import { AiPromptConverterService } from './common/services/ai-prompt-converter.service';
import { AiResponseService } from './common/services/ai-response.service';

@Module({
  imports: [CacheManagerModule, ExampleModule],
  providers: [
    UnifiedAiTranslatorService,
    AiTokenService,
    AiPromptConverterService,
    AiResponseService,
  ],
  exports: [UnifiedAiTranslatorService],
})
export class AiModule {}
