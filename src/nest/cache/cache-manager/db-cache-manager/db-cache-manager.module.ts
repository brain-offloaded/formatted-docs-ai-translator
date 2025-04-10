import { Module } from '@nestjs/common';

import { DbModule } from '../../../db/db.module';
import { LoaderModule } from '../../loader/loader.module';

import { IDbCacheManagerService } from './services/i-db-cache-manager-service';
import { SqliteCacheManagerService } from './services/sqlite-cache-manager.service';

@Module({
  imports: [DbModule, LoaderModule],
  providers: [{ provide: IDbCacheManagerService, useClass: SqliteCacheManagerService }],
  exports: [IDbCacheManagerService],
})
export class DbManagerCacheModule {}
