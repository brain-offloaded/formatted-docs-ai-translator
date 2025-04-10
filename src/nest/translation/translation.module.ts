import { Module } from '@nestjs/common';

import { ExampleModule } from './example/example.module';
import { TranslatorModule } from './translator/translator.module';

@Module({
  imports: [TranslatorModule, ExampleModule],
  exports: [TranslatorModule, ExampleModule],
})
export class TranslationModule {}
