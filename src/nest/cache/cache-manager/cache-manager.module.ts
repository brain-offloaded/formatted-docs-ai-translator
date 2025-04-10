import { Module } from '@nestjs/common';

import { LoaderModule } from '../loader/loader.module';

import { DbManagerCacheModule } from './db-cache-manager/db-cache-manager.module';
import { MemoryCacheManagerModule } from './memory-cache-manager/memory-cache-manager.module';
import { CacheManagerService } from './services/cache-manager.service';
import { ICacheManagerService } from './services/i-cache-manager-service';

@Module({
  imports: [DbManagerCacheModule, MemoryCacheManagerModule, LoaderModule],
  providers: [{ provide: ICacheManagerService, useClass: CacheManagerService }],
  exports: [ICacheManagerService],
})
export class CacheManagerModule {}
