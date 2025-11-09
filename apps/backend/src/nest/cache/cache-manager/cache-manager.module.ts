import { Module } from '@nestjs/common';

import { LoaderModule } from '../loader/loader.module';

import { DbManagerCacheModule } from './db-cache-manager/db-cache-manager.module';
import { MemoryCacheManagerModule } from './memory-cache-manager/memory-cache-manager.module';
import { CacheManagerService } from './services/cache-manager.service';
import { ICacheManagerService } from './services/i-cache-manager-service';
import { CacheCommandBus } from '@/nest/cache/commands/command-bus.service';
import { CACHE_COMMAND_HANDLERS } from '@/nest/cache/commands/command.tokens';
import { ImportTranslationsHandler } from '@/nest/cache/commands/handlers/import-translations.handler';
import type { CacheCommandHandler } from '@/nest/cache/commands/cache-command.types';
import { TransactionModule } from '@/nest/common/transaction/transaction.module';

const COMMAND_HANDLER_PROVIDERS = [ImportTranslationsHandler];

@Module({
  imports: [DbManagerCacheModule, MemoryCacheManagerModule, LoaderModule, TransactionModule],
  providers: [
    CacheCommandBus,
    ...COMMAND_HANDLER_PROVIDERS,
    {
      provide: CACHE_COMMAND_HANDLERS,
      useFactory: (...handlers: CacheCommandHandler[]) => handlers,
      inject: COMMAND_HANDLER_PROVIDERS,
    },
    { provide: ICacheManagerService, useClass: CacheManagerService },
  ],
  exports: [ICacheManagerService],
})
export class CacheManagerModule {}
