import { Module } from '@nestjs/common';

import { CacheManagerModule } from '../../../cache/cache-manager/cache-manager.module';
import { ExampleModule } from '../../../translation/example/example.module';
import { GeminiPromptModule } from '../prompt/gemini-prompt.module';
import { AiTokenService } from './services/gemini-token.service';
import { GeminiResponseService } from './services/gemini-response.service';
import { GeminiTranslatorService } from './services/gemini-translator.service';

@Module({
  imports: [CacheManagerModule, GeminiPromptModule, ExampleModule],
  providers: [GeminiTranslatorService, AiTokenService, GeminiResponseService],
  exports: [GeminiTranslatorService],
})
export class GeminiTranslatorModule {}
