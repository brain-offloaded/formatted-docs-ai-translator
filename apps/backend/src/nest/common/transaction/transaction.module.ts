import { Module } from '@nestjs/common';

import { PrismaDbModule } from '../../db/prisma/prisma.module';

import { UnitOfWork } from './unit-of-work.service';

@Module({
  imports: [PrismaDbModule],
  providers: [UnitOfWork],
  exports: [UnitOfWork],
})
export class TransactionModule {}
