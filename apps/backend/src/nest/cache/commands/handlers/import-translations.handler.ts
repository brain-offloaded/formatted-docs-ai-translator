import { Inject, Injectable } from '@nestjs/common';

import { DEFAULT_CACHE_TAG } from '@apps/common/dist/constants/cache';
import { TranslationLoaderService } from '@/nest/cache/loader/translation-loader/translation-loader.service';
import { normalizeCacheTag } from '@apps/common/dist/utils/cache-tag';

import { buildMemoryCacheKey } from '../../cache-manager/utils/cache-key';
import { IMemoryCacheManagerService } from '../../cache-manager/memory-cache-manager/services/i-memory-cache-manager-service';
import { LoggerService } from '@/nest/logger/logger.service';
import { UnitOfWork } from '@/nest/common/transaction/unit-of-work.service';
import { CacheCommandHandler } from '../cache-command.types';
import { ImportTranslationsCommand } from '../commands/import-translations.command';

@Injectable()
export class ImportTranslationsHandler
  implements CacheCommandHandler<ImportTranslationsCommand, number>
{
  public readonly commandType = ImportTranslationsCommand.type;

  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly translationLoaderService: TranslationLoaderService,
    @Inject(IMemoryCacheManagerService)
    private readonly memoryCacheManagerService: IMemoryCacheManagerService,
    private readonly logger: LoggerService
  ) {}

  public async execute(command: ImportTranslationsCommand): Promise<number> {
    if (command.translations.length === 0) {
      return 0;
    }

    return this.unitOfWork.execute(async (transaction, context) => {
      let updatedCount = 0;
      const memoryUpdates: Array<() => Promise<void>> = [];

      for (const translation of command.translations) {
        const existing = await transaction.translation.findUnique({
          where: { id: translation.id },
          include: { cacheTag: true },
        });

        if (!existing) {
          continue;
        }

        const existingTagName = existing.cacheTag?.name ?? DEFAULT_CACHE_TAG;
        const normalizedExistingTag = normalizeCacheTag(existingTagName);
        const normalizedTargetTag = normalizeCacheTag(translation.cacheTag ?? existingTagName);

        if (
          existing.source !== translation.source ||
          normalizedExistingTag !== normalizedTargetTag
        ) {
          continue;
        }

        const updated = await this.translationLoaderService.updateTranslation(
          translation.id,
          translation.target,
          transaction,
          context
        );

        if (!updated) {
          continue;
        }

        const resolvedTag = updated.cacheTag?.name ?? DEFAULT_CACHE_TAG;
        const memoryKey = buildMemoryCacheKey(updated.source, resolvedTag);

        memoryUpdates.push(async () => {
          await this.memoryCacheManagerService.setTranslation(memoryKey, updated.target);
        });

        updatedCount += 1;
      }

      if (memoryUpdates.length > 0) {
        context.registerPostCommitHook(async () => {
          for (const updateMemory of memoryUpdates) {
            try {
              await updateMemory();
            } catch (error) {
              this.logger.error('번역 임포트 후 메모리 캐시 업데이트 중 오류가 발생했습니다.', {
                error,
              });
            }
          }
        });
      }

      return updatedCount;
    });
  }
}
