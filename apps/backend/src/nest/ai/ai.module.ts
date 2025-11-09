import { Module } from '@nestjs/common';
import { UnifiedAiTranslatorService } from './services/unified-ai-translator.service';
import { ExampleModule } from '../translation/example/example.module';
import { CacheManagerModule } from '../cache/cache-manager/cache-manager.module';
import { AiTokenService } from './services/ai-token.service';
import { AiPromptConverterService } from './services/ai-prompt-converter.service';
import { AiProxyService } from './services/ai-proxy.service';
import { GoogleAiProviderService } from './services/providers/google-ai.provider';
import { OpenAiCompatibleProviderService } from './services/providers/openai-compatible.provider';

@Module({
  imports: [CacheManagerModule, ExampleModule],
  providers: [
    UnifiedAiTranslatorService,
    AiTokenService,
    AiPromptConverterService,
    // Provider-specific services
    GoogleAiProviderService, // Now handles both Google AI and Vertex AI
    OpenAiCompatibleProviderService,
    // Dispatcher
    AiProxyService,
  ],
  exports: [UnifiedAiTranslatorService],
})
export class AiModule {}
