import { Module } from '@nestjs/common';

import { CacheManagerModule } from './cache-manager/cache-manager.module';
import { LoaderModule } from './loader/loader.module';
import { CacheTranslationsController } from './translations/cache-translations.controller';
import { CacheTagsController } from './tags/cache-tags.controller';

@Module({
  imports: [LoaderModule, CacheManagerModule],
  controllers: [CacheTranslationsController, CacheTagsController],
  exports: [CacheManagerModule, LoaderModule],
})
export class CacheModule {}
