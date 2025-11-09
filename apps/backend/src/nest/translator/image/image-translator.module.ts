import { Module } from '@nestjs/common';
import { AiModule } from '../../ai/ai.module';
import { CacheManagerModule } from '../../cache/cache-manager/cache-manager.module';
import { PromptPresetModule } from '../../translation/prompt/prompt.module';
import { LoggerModule } from '../../logger/logger.module';
import { ImageTranslatorService } from './services/image-translator.service';
import { ImageTranslatorController } from './image-translator.controller';

@Module({
  imports: [AiModule, CacheManagerModule, PromptPresetModule, LoggerModule],
  providers: [ImageTranslatorService],
  controllers: [ImageTranslatorController],
  exports: [ImageTranslatorService],
})
export class ImageTranslatorModule {}
