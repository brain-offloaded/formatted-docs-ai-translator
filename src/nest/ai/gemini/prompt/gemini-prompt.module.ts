import { Module } from '@nestjs/common';

import { ExampleModule } from '../../../translation/example/example.module';

import { GeminiPromptConverterService as GeminiPromptConverterService } from './services/gemini-prompt-converter.service';

@Module({
  imports: [ExampleModule],
  providers: [GeminiPromptConverterService],
  exports: [GeminiPromptConverterService],
})
export class GeminiPromptModule {}
