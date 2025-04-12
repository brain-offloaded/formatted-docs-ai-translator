import { Module } from '@nestjs/common';

import { CacheModule } from './cache/cache.module';
import { DbModule } from './db/db.module';
import { LoggerModule } from './logger/logger.module';
import { ParserModule } from './parser/parser.module';
import { TranslationModule } from './translation/translation.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [ParserModule, DbModule, CacheModule, LoggerModule, TranslationModule, CommonModule],
  controllers: [],
})
export class AppModule {}
