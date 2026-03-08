import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { Prisma, CacheTag } from '@prisma/client';

import { PrismaService } from '@/nest/db/prisma/prisma.service';
import { LoggerService } from '@/nest/logger/logger.service';
import { errorToString } from '@/nest/utils/error-stringify';
import { DEFAULT_CACHE_TAG } from '@apps/common/dist/constants/cache';
import { normalizeCacheTag } from '@apps/common/dist/utils/cache-tag';
import { TranslationData, TranslationHistoryData } from '@apps/common/dist/types/cache';
import type { TransactionContext } from '@/nest/common/transaction/unit-of-work.service';

const CACHE_KEY_SEPARATOR = '__@CACHE_TAG_SEPARATOR@__';

const buildSourceCacheKey = (source: string, cacheTag: string): string =>
  `${cacheTag}${CACHE_KEY_SEPARATOR}${source}`;

const parseSourceCacheKey = (key: string): { source: string; cacheTag: string } => {
  const separatorIndex = key.indexOf(CACHE_KEY_SEPARATOR);
  if (separatorIndex === -1) {
    return { source: key, cacheTag: DEFAULT_CACHE_TAG };
  }
  return {
    cacheTag: key.slice(0, separatorIndex),
    source: key.slice(separatorIndex + CACHE_KEY_SEPARATOR.length),
  };
};

type HistoryWithRelations = Prisma.TranslationHistoryGetPayload<{
  include: { cacheTag: true };
}>;

@Injectable()
export class TranslationLoaderService {
  private sourceLoader: DataLoader<string, TranslationData | null>;
  private idLoader: DataLoader<number, TranslationData | null>;
  private historyLoader: DataLoader<number, TranslationHistoryData[]>;
  private sourceHistoryLoader: DataLoader<string, TranslationHistoryData[]>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService
  ) {
    this.sourceLoader = new DataLoader<string, TranslationData | null>(
      async (keys) => this.loadTranslationsBySourceKeys(keys),
      { maxBatchSize: 100, cache: true, cacheMap: new Map() }
    );

    this.idLoader = new DataLoader<number, TranslationData | null>(
      async (ids) => this.loadTranslationsByIds(ids),
      { maxBatchSize: 100, cache: true, cacheMap: new Map() }
    );

    this.historyLoader = new DataLoader<number, TranslationHistoryData[]>(
      async (translationIds) => this.loadHistoriesByTranslationIds(translationIds),
      { maxBatchSize: 100, cache: true, cacheMap: new Map() }
    );

    this.sourceHistoryLoader = new DataLoader<string, TranslationHistoryData[]>(
      async (keys) => this.loadHistoriesBySourceKeys(keys),
      { maxBatchSize: 100, cache: true, cacheMap: new Map() }
    );
  }

  private async loadTranslationsBySourceKeys(
    keys: readonly string[]
  ): Promise<(TranslationData | null)[]> {
    if (keys.length === 0) {
      return [];
    }

    const parsedKeys = keys.map(parseSourceCacheKey);

    try {
      const uniqueCacheTagNames = [
        ...new Set(parsedKeys.map((k) => normalizeCacheTag(k.cacheTag))),
      ];
      const cacheTags = await this.prisma.cacheTag.findMany({
        where: { name: { in: uniqueCacheTagNames } },
      });
      const cacheTagNameToIdMap = new Map(cacheTags.map((tag) => [tag.name, tag.id]));

      const conditions = parsedKeys
        .map(({ source, cacheTag }) => {
          const normalizedTag = normalizeCacheTag(cacheTag);
          const cacheTagId = cacheTagNameToIdMap.get(normalizedTag);
          if (cacheTagId === undefined) {
            return null;
          }
          return { source, cacheTagId };
        })
        .filter((c): c is { source: string; cacheTagId: number } => c !== null);

      if (conditions.length === 0) {
        return keys.map(() => null);
      }

      const translations = await this.prisma.translation.findMany({
        where: { OR: conditions, success: true },
        include: { cacheTag: true },
      });

      const translationMap = new Map(
        translations.map((t) => [buildSourceCacheKey(t.source, t.cacheTag.name), t])
      );

      return keys.map((key) => translationMap.get(key) ?? null);
    } catch (error) {
      this.logger.error('배치 번역 조회 중 오류:', { error });
      return keys.map(() => null);
    }
  }

  private async loadTranslationsByIds(ids: readonly number[]): Promise<(TranslationData | null)[]> {
    if (ids.length === 0) {
      return [];
    }

    try {
      const translations = await this.prisma.translation.findMany({
        where: { id: { in: ids as number[] } },
        include: { cacheTag: true },
      });

      const translationMap = new Map(translations.map((t) => [t.id, t]));
      return ids.map((id) => translationMap.get(id) ?? null);
    } catch (error) {
      this.logger.error('ID로 번역 배치 조회 중 오류:', { error });
      return ids.map(() => null);
    }
  }

  private async loadHistoriesByTranslationIds(
    translationIds: readonly number[]
  ): Promise<TranslationHistoryData[][]> {
    if (translationIds.length === 0) {
      return [];
    }

    try {
      const histories = await this.prisma.translationHistory.findMany({
        where: { translationId: { in: translationIds as number[] } },
        include: { cacheTag: true },
        orderBy: { createdAt: 'desc' },
      });

      const historyMap = new Map<number, TranslationHistoryData[]>();
      histories.forEach((history) => {
        const existing = historyMap.get(history.translationId) ?? [];
        existing.push(this.toHistoryData(history));
        historyMap.set(history.translationId, existing);
      });

      return translationIds.map((id) => historyMap.get(id) ?? []);
    } catch (error) {
      this.logger.error('번역 이력 배치 조회 중 오류:', { error });
      return translationIds.map(() => []);
    }
  }

  private async loadHistoriesBySourceKeys(
    keys: readonly string[]
  ): Promise<TranslationHistoryData[][]> {
    if (keys.length === 0) {
      return [];
    }

    try {
      const parsedKeys = keys.map(parseSourceCacheKey);
      const uniqueCacheTagNames = [
        ...new Set(parsedKeys.map((k) => normalizeCacheTag(k.cacheTag))),
      ];
      const cacheTags = await this.prisma.cacheTag.findMany({
        where: { name: { in: uniqueCacheTagNames } },
      });
      const cacheTagNameToIdMap = new Map(cacheTags.map((tag) => [tag.name, tag.id]));

      const conditions = parsedKeys
        .map(({ source, cacheTag }) => {
          const normalizedTag = normalizeCacheTag(cacheTag);
          const cacheTagId = cacheTagNameToIdMap.get(normalizedTag);
          if (cacheTagId === undefined) {
            return null;
          }
          return { source, cacheTagId };
        })
        .filter((c): c is { source: string; cacheTagId: number } => c !== null);

      if (conditions.length === 0) {
        return keys.map(() => []);
      }

      const translations = await this.prisma.translation.findMany({
        where: { OR: conditions },
        select: { id: true, source: true, cacheTag: { select: { name: true } } },
      });

      if (translations.length === 0) {
        return keys.map(() => []);
      }

      const translationKeyMap = new Map<number, string>();
      translations.forEach((translation) => {
        const key = buildSourceCacheKey(translation.source, translation.cacheTag.name);
        translationKeyMap.set(translation.id, key);
      });

      const histories = await this.prisma.translationHistory.findMany({
        where: { translationId: { in: Array.from(translationKeyMap.keys()) } },
        include: { cacheTag: true },
        orderBy: { createdAt: 'asc' },
      });

      const historiesByKey = new Map<string, TranslationHistoryData[]>();
      keys.forEach((key) => historiesByKey.set(key, []));

      histories.forEach((history) => {
        const key = translationKeyMap.get(history.translationId);
        if (!key) {
          return;
        }
        const list = historiesByKey.get(key) ?? [];
        list.push(this.toHistoryData(history));
        historiesByKey.set(key, list);
      });

      return keys.map((key) => historiesByKey.get(key) ?? []);
    } catch (error) {
      this.logger.error('소스별 번역 이력 조회 중 오류:', { error: errorToString(error) });
      return keys.map(() => []);
    }
  }

  public async loadBySource(source: string, cacheTag: string): Promise<TranslationData | null> {
    try {
      return await this.sourceLoader.load(buildSourceCacheKey(source, normalizeCacheTag(cacheTag)));
    } catch (error) {
      this.logger.error(`번역 로드 중 오류: ${error}`, { source });
      return null;
    }
  }

  public async loadManyBySource(
    sources: string[],
    cacheTag: string
  ): Promise<Map<string, TranslationData | null>> {
    try {
      const normalizedTag = normalizeCacheTag(cacheTag);
      const keys = sources.map((source) => buildSourceCacheKey(source, normalizedTag));
      const results = await this.sourceLoader.loadMany(keys);
      const resultMap = new Map<string, TranslationData | null>();

      sources.forEach((source, index) => {
        const result = results[index];
        resultMap.set(source, result instanceof Error ? null : result);
      });

      return resultMap;
    } catch (error) {
      this.logger.error(`다중 번역 로드 중 오류: ${error}`);
      return new Map(sources.map((source) => [source, null]));
    }
  }

  public async loadById(id: number): Promise<TranslationData | null> {
    try {
      return await this.idLoader.load(id);
    } catch (error) {
      this.logger.error(`ID로 번역 로드 중 오류: ${error}`, { id });
      return null;
    }
  }

  public async loadManyById(ids: number[]): Promise<Array<TranslationData | null>> {
    try {
      const results = await this.idLoader.loadMany(ids);
      return results.map((result) => (result instanceof Error ? null : result));
    } catch (error) {
      this.logger.error(`다중 ID로 번역 로드 중 오류: ${error}`);
      return ids.map(() => null);
    }
  }

  public async loadHistoryByTranslationId(
    translationId: number
  ): Promise<TranslationHistoryData[]> {
    try {
      return await this.historyLoader.load(translationId);
    } catch (error) {
      this.logger.error(`번역 이력 로드 중 오류: ${error}`, { translationId });
      return [];
    }
  }

  public async loadHistoryBySource(
    source: string,
    cacheTag: string
  ): Promise<TranslationHistoryData[]> {
    try {
      return await this.sourceHistoryLoader.load(
        buildSourceCacheKey(source, normalizeCacheTag(cacheTag))
      );
    } catch (error) {
      this.logger.error(`소스별 번역 이력 로드 중 오류: ${error}`, { source });
      return [];
    }
  }

  public clearCache(): void {
    this.sourceLoader.clearAll();
    this.idLoader.clearAll();
    this.historyLoader.clearAll();
    this.sourceHistoryLoader.clearAll();
  }

  public clearSourceCache(source: string, cacheTag: string): void {
    const key = buildSourceCacheKey(source, normalizeCacheTag(cacheTag));
    this.sourceLoader.clear(key);
    this.sourceHistoryLoader.clear(key);
  }

  public clearIdCache(id: number): void {
    this.idLoader.clear(id);
    this.historyLoader.clear(id);
  }

  public async saveTranslation(
    source: string,
    target: string,
    success: boolean = true,
    modelName: string = 'unknown',
    cacheTagName: string = DEFAULT_CACHE_TAG,
    error: string | null = null,
    transactionClient?: Prisma.TransactionClient,
    transactionContext?: TransactionContext
  ): Promise<void> {
    try {
      await this.executeWithClient(
        transactionClient,
        transactionContext,
        async (client, schedule) => {
          const cacheTag = await this.ensureCacheTag(cacheTagName, client);
          const translation = await client.translation.upsert({
            where: {
              source_cacheTagId: {
                source,
                cacheTagId: cacheTag.id,
              },
            },
            update: {
              target,
              success,
              lastAccessedAt: new Date(),
            },
            create: {
              source,
              target,
              success,
              cacheTagId: cacheTag.id,
            },
            include: { cacheTag: true },
          });

          await client.translationHistory.create({
            data: {
              translationId: translation.id,
              source,
              target,
              success,
              error,
              model: modelName,
              cacheTagId: cacheTag.id,
            },
          });

          schedule(async () => this.clearSourceCache(source, cacheTag.name));
        }
      );
    } catch (error) {
      this.logger.error(`번역 저장 중 오류: ${error}`, { source });
    }
  }

  public async saveManyTranslations(
    translations: Map<string, string>,
    success: boolean = true,
    modelName: string = 'unknown',
    cacheTagName: string = DEFAULT_CACHE_TAG,
    error: string | null = null,
    transactionClient?: Prisma.TransactionClient,
    transactionContext?: TransactionContext
  ): Promise<void> {
    if (translations.size === 0) {
      return;
    }

    try {
      await this.executeWithClient(
        transactionClient,
        transactionContext,
        async (client, schedule) => {
          const cacheTag = await this.ensureCacheTag(cacheTagName, client);

          for (const [source, target] of translations.entries()) {
            const translation = await client.translation.upsert({
              where: {
                source_cacheTagId: {
                  source,
                  cacheTagId: cacheTag.id,
                },
              },
              update: {
                target,
                success,
                lastAccessedAt: new Date(),
              },
              create: {
                source,
                target,
                success,
                cacheTagId: cacheTag.id,
              },
              include: { cacheTag: true },
            });

            await client.translationHistory.create({
              data: {
                translationId: translation.id,
                source,
                target,
                success,
                error,
                model: modelName,
                cacheTagId: cacheTag.id,
              },
            });
          }

          const normalizedTag = cacheTag.name;
          const sources = Array.from(translations.keys());
          schedule(async () => {
            sources.forEach((source) => this.clearSourceCache(source, normalizedTag));
          });
        }
      );
    } catch (error) {
      this.logger.error(`다중 번역 저장 중 오류: ${error}`);
    }
  }

  public async updateTranslation(
    id: number,
    newTarget: string,
    transactionClient?: Prisma.TransactionClient,
    transactionContext?: TransactionContext
  ): Promise<TranslationData | null> {
    try {
      return await this.executeWithClient(
        transactionClient,
        transactionContext,
        async (client, schedule) => {
          const translation = await client.translation.findUnique({
            where: { id },
            include: { cacheTag: true },
          });

          if (!translation) {
            this.logger.warn(`ID가 ${id}인 번역을 찾을 수 없습니다.`);
            return null;
          }

          const updated = await client.translation.update({
            where: { id },
            data: {
              target: newTarget,
              success: true,
              lastAccessedAt: new Date(),
            },
            include: { cacheTag: true },
          });

          await client.translationHistory.create({
            data: {
              translationId: updated.id,
              source: updated.source,
              target: updated.target,
              success: true,
              model: 'manual',
              cacheTagId: updated.cacheTagId,
            },
          });

          schedule(async () => {
            const normalizedTag = updated.cacheTag?.name ?? DEFAULT_CACHE_TAG;
            this.clearIdCache(id);
            this.clearSourceCache(translation.source, normalizedTag);
            this.idLoader.prime(id, updated);
            this.sourceLoader.prime(
              buildSourceCacheKey(translation.source, normalizedTag),
              updated
            );
          });

          this.logger.info(`ID가 ${id}인 번역이 업데이트되었습니다.`);
          return updated;
        }
      );
    } catch (error) {
      this.logger.error(`ID가 ${id}인 번역 업데이트 중 오류:`, { error });
      return null;
    }
  }

  public async deleteTranslationsByIds(ids: number[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    try {
      const translationsToDelete = await this.prisma.translation.findMany({
        where: { id: { in: ids } },
        select: { id: true, source: true, cacheTag: { select: { name: true } } },
      });

      if (translationsToDelete.length === 0) {
        return;
      }

      await this.prisma.translationHistory.deleteMany({
        where: { translationId: { in: ids } },
      });
      await this.prisma.translation.deleteMany({ where: { id: { in: ids } } });

      translationsToDelete.forEach((translation) => {
        this.clearIdCache(translation.id);
        this.clearSourceCache(translation.source, translation.cacheTag?.name || DEFAULT_CACHE_TAG);
      });

      this.logger.info(`${ids.length}개의 번역이 삭제되었습니다.`);
    } catch (error) {
      this.logger.error('ID로 번역 삭제 중 오류:', { error, ids });
    }
  }

  private async runAfterCommitOrNow(
    transactionContext: TransactionContext | undefined,
    task: () => Promise<void> | void
  ): Promise<void> {
    if (transactionContext) {
      transactionContext.registerPostCommitHook(task);
      return;
    }

    await this.safeRun(task);
  }

  private async executeWithClient<T>(
    transactionClient: Prisma.TransactionClient | undefined,
    transactionContext: TransactionContext | undefined,
    executor: (
      client: Prisma.TransactionClient,
      schedulePostCommit: (task: () => Promise<void> | void) => void
    ) => Promise<T>
  ): Promise<T> {
    if (transactionClient) {
      return executor(transactionClient, (task) => {
        void this.runAfterCommitOrNow(transactionContext, task);
      });
    }

    const postCommitTasks: Array<() => Promise<void> | void> = [];

    const result = await this.prisma.$transaction(async (client) =>
      executor(client, (task) => {
        if (typeof task === 'function') {
          postCommitTasks.push(task);
        }
      })
    );

    for (const task of postCommitTasks) {
      await this.safeRun(task);
    }

    return result;
  }

  private async ensureCacheTag(name: string, client: Prisma.TransactionClient): Promise<CacheTag> {
    const normalizedName = normalizeCacheTag(name);
    return client.cacheTag.upsert({
      where: { name: normalizedName },
      update: {},
      create: { name: normalizedName },
    });
  }

  private toHistoryData(history: HistoryWithRelations): TranslationHistoryData {
    return {
      id: history.id,
      translationId: history.translationId,
      source: history.source,
      target: history.target,
      success: history.success,
      error: history.error,
      model: history.model,
      createdAt: history.createdAt,
      cacheTag: history.cacheTag,
    };
  }

  private async safeRun(task: () => Promise<void> | void): Promise<void> {
    try {
      await task();
    } catch (error) {
      this.logger.error('후처리 작업 실행 중 오류가 발생했습니다.', { error });
    }
  }
}
