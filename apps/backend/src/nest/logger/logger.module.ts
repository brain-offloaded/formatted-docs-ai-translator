import { Module, Global } from '@nestjs/common';

import { DbModule } from '../db/db.module';

import { LoggerController } from './logger.controller';
import { LoggerService } from './logger.service';

@Global()
@Module({
  imports: [DbModule],
  providers: [LoggerService],
  controllers: [LoggerController],
  exports: [LoggerService],
})
export class LoggerModule {}
