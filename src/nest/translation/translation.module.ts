import { Module } from '@nestjs/common';

import { ExampleModule } from './example/example.module';
import { TranslatorModule } from './translator/translator.module';
import { PromptPresetModule } from './prompt/prompt.module'; // PromptPresetModule 추가

@Module({
  imports: [TranslatorModule, ExampleModule, PromptPresetModule], // PromptPresetModule 추가
  exports: [TranslatorModule, ExampleModule, PromptPresetModule], // PromptPresetModule 추가
})
export class TranslationModule {}
