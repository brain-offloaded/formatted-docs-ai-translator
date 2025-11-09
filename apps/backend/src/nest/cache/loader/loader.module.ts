import { Module } from '@nestjs/common';

import { DbModule } from '../../db/db.module';

import { TranslationLoaderService } from './translation-loader/translation-loader.service';

@Module({
  imports: [DbModule],
  providers: [TranslationLoaderService],
  exports: [TranslationLoaderService],
})
export class LoaderModule {}
