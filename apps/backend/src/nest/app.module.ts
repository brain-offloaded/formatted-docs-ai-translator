import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';

import { CacheModule } from './cache/cache.module';
import { DbModule } from './db/db.module';
import { LoggerModule } from './logger/logger.module';
import { ExampleModule } from './translation/example/example.module';
import { PromptPresetModule } from './translation/prompt/prompt.module';
import { ModelPresetModule } from './translation/model-preset/model-preset.module';
import { TranslatorModule } from './translation/translator/translator.module';
import { CommonModule } from './common/common.module';
import { SettingsModule } from './settings/settings.module';
import { ImageTranslatorModule } from './translator/image/image-translator.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    DbModule,
    CacheModule,
    LoggerModule,
    ExampleModule,
    PromptPresetModule,
    ModelPresetModule,
    TranslatorModule,
    CommonModule,
    SettingsModule,
    ImageTranslatorModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
