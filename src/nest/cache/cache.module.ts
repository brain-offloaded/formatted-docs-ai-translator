import { Module } from '@nestjs/common';

import { CacheManagerModule } from './cache-manager/cache-manager.module';
import { CacheIpcHandler } from './cache.ipc.handler';
import { LoaderModule } from './loader/loader.module';

@Module({
  imports: [LoaderModule, CacheManagerModule],
  exports: [CacheManagerModule, LoaderModule],
  providers: [CacheIpcHandler],
})
export class CacheModule {}
