import { Module } from '@nestjs/common';

import { GeminiTranslatorModule } from './translator/gemini-translator.module';

@Module({
  imports: [GeminiTranslatorModule],
  providers: [],
  exports: [GeminiTranslatorModule],
})
export class GeminiModule {}
