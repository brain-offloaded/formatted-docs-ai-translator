import { Module } from '@nestjs/common';

import { DbIpcHandler } from './db.ipc.handler';
import { DbService } from './services/db.service';
import { TypeOrmDbModule } from './typeorm/typeorm.module';

@Module({
  imports: [TypeOrmDbModule],
  providers: [DbIpcHandler, DbService],
  exports: [TypeOrmDbModule],
})
export class DbModule {}
