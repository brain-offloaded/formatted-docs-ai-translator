import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';

import { CacheModule } from './cache/cache.module';
import { DbModule } from './db/db.module';
import { LoggerModule } from './logger/logger.module';
import { ParserModule } from './parser/parser.module';
import { ExampleModule } from './translation/example/example.module';
import { PromptPresetModule } from './translation/prompt/prompt.module';
import { TranslatorModule } from './translation/translator/translator.module';
import { CommonModule } from './common/common.module';
import { IpcExceptionFilter } from './common/filters/ipc-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ParserModule,
    DbModule,
    CacheModule,
    LoggerModule,
    ExampleModule,
    PromptPresetModule,
    TranslatorModule,
    CommonModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: IpcExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    },
  ],
})
export class AppModule {}
