import { Module } from '@nestjs/common';

import { CacheModule } from './cache/cache.module';
import { UpdateModule } from './common/updater/update.module';
import { DbModule } from './db/db.module';
import { LoggerModule } from './logger/logger.module';
import { ParserModule } from './parser/parser.module';
import { TranslationModule } from './translation/translation.module';

@Module({
  imports: [ParserModule, DbModule, CacheModule, LoggerModule, TranslationModule, UpdateModule],
  controllers: [],
})
export class AppModule {}
