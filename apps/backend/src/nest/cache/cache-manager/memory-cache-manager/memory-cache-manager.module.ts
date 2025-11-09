import { Module } from '@nestjs/common';

import { IMemoryCacheManagerService } from './services/i-memory-cache-manager-service';
import { LruCacheManagerService } from './services/lru-cache-manager.service';

@Module({
  providers: [{ provide: IMemoryCacheManagerService, useClass: LruCacheManagerService }],
  exports: [IMemoryCacheManagerService],
})
export class MemoryCacheManagerModule {}
