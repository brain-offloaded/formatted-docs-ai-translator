import { CacheManagerService } from '../cache-manager.service';
import { buildMemoryCacheKey } from '../../utils/cache-key';
import type { IMemoryCacheManagerService } from '../../memory-cache-manager/services/i-memory-cache-manager-service';
import type { IDbCacheManagerService } from '../../db-cache-manager/services/i-db-cache-manager-service';
import type { CacheCommandBus } from '@/nest/cache/commands/command-bus.service';
import { LoggerService } from '@/nest/logger/logger.service';
import { CacheTranslation } from '@apps/common/dist/types/cache';

describe('CacheManagerService - cache tag operations', () => {
  const createService = () => {
    const memoryCacheManagerServiceMock = {
      invalidate: jest.fn(),
      invalidateMany: jest.fn().mockResolvedValue(undefined),
      setTranslation: jest.fn(),
      getTranslation: jest.fn(),
    } satisfies Pick<
      IMemoryCacheManagerService,
      'invalidate' | 'invalidateMany' | 'setTranslation' | 'getTranslation'
    >;

    const dbCacheManagerServiceMock = {
      findCacheTagById: jest.fn(),
      deleteCacheTag: jest.fn().mockResolvedValue(undefined),
      findTranslationsByCondition: jest.fn(),
      updateTranslationCacheTag: jest.fn().mockResolvedValue(undefined),
      findTranslationsByIds: jest.fn(),
    } satisfies Pick<
      IDbCacheManagerService,
      | 'findCacheTagById'
      | 'deleteCacheTag'
      | 'findTranslationsByCondition'
      | 'updateTranslationCacheTag'
      | 'findTranslationsByIds'
    >;

    const commandBusMock = { execute: jest.fn() } satisfies Pick<CacheCommandBus, 'execute'>;
    const loggerMock = { warn: jest.fn(), error: jest.fn() } satisfies Pick<
      LoggerService,
      'warn' | 'error'
    >;

    const service = new CacheManagerService(
      memoryCacheManagerServiceMock as unknown as IMemoryCacheManagerService,
      dbCacheManagerServiceMock as unknown as IDbCacheManagerService,
      commandBusMock as unknown as CacheCommandBus,
      loggerMock as unknown as LoggerService
    );

    return {
      service,
      memoryCacheManagerService: memoryCacheManagerServiceMock,
      dbCacheManagerService: dbCacheManagerServiceMock,
    };
  };

  it('재할당 모드에서 기존 및 대상 캐시 키를 모두 무효화한다', async () => {
    const { service, memoryCacheManagerService, dbCacheManagerService } = createService();

    dbCacheManagerService.findCacheTagById
      .mockResolvedValueOnce({ id: 1, name: 'origin-tag' })
      .mockResolvedValueOnce({ id: 2, name: 'target-tag' });

    const translations: CacheTranslation[] = [
      {
        id: 10,
        source: 'hello',
        target: 'world',
        cacheTag: 'origin-tag',
        cacheTagId: 1,
        createdAt: '',
        lastAccessedAt: '',
        fileName: null,
        filePath: null,
      },
    ];

    dbCacheManagerService.findTranslationsByCondition.mockResolvedValue(translations);

    await service.deleteCacheTag(1, { mode: 'reassign', targetTagId: 2 });

    expect(dbCacheManagerService.deleteCacheTag).toHaveBeenCalledWith(1, {
      mode: 'reassign',
      targetTagId: 2,
    });

    expect(memoryCacheManagerService.invalidateMany).toHaveBeenNthCalledWith(1, [
      buildMemoryCacheKey('hello', 'origin-tag'),
    ]);
    expect(memoryCacheManagerService.invalidateMany).toHaveBeenNthCalledWith(2, [
      buildMemoryCacheKey('hello', 'target-tag'),
    ]);
  });

  it('연쇄 삭제 모드에서 연결된 번역 캐시만 무효화한다', async () => {
    const { service, memoryCacheManagerService, dbCacheManagerService } = createService();

    dbCacheManagerService.findCacheTagById.mockResolvedValue({ id: 1, name: 'old-tag' });

    const translations: CacheTranslation[] = [
      {
        id: 11,
        source: 'foo',
        target: 'bar',
        cacheTag: 'old-tag',
        cacheTagId: 1,
        createdAt: '',
        lastAccessedAt: '',
        fileName: null,
        filePath: null,
      },
      {
        id: 12,
        source: 'baz',
        target: 'qux',
        cacheTag: 'old-tag',
        cacheTagId: 1,
        createdAt: '',
        lastAccessedAt: '',
        fileName: null,
        filePath: null,
      },
    ];

    dbCacheManagerService.findTranslationsByCondition.mockResolvedValue(translations);

    await service.deleteCacheTag(1, { mode: 'cascade' });

    expect(memoryCacheManagerService.invalidateMany).toHaveBeenCalledTimes(1);
    expect(memoryCacheManagerService.invalidateMany).toHaveBeenCalledWith([
      buildMemoryCacheKey('foo', 'old-tag'),
      buildMemoryCacheKey('baz', 'old-tag'),
    ]);
  });

  it('번역 캐시 태그 변경 시 원본과 대상 캐시 키를 무효화한다', async () => {
    const { service, memoryCacheManagerService, dbCacheManagerService } = createService();

    const translation: CacheTranslation = {
      id: 21,
      source: 'sample',
      target: 'result',
      cacheTag: 'before-tag',
      cacheTagId: 1,
      createdAt: '',
      lastAccessedAt: '',
      fileName: null,
      filePath: null,
    };

    dbCacheManagerService.findTranslationsByIds.mockResolvedValue([translation]);
    dbCacheManagerService.findCacheTagById.mockResolvedValue({ id: 2, name: 'after-tag' });

    await service.updateTranslationCacheTag(21, 2);

    expect(dbCacheManagerService.updateTranslationCacheTag).toHaveBeenCalledWith(21, 2);
    expect(memoryCacheManagerService.invalidateMany).toHaveBeenCalledWith([
      buildMemoryCacheKey('sample', 'before-tag'),
      buildMemoryCacheKey('sample', 'after-tag'),
    ]);
  });
});
