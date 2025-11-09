import { Module } from '@nestjs/common';

import { DbController } from './db.controller';
import { DbService } from './services/db.service';
import { PrismaDbModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaDbModule],
  controllers: [DbController],
  providers: [DbService],
  exports: [PrismaDbModule],
})
export class DbModule {}
