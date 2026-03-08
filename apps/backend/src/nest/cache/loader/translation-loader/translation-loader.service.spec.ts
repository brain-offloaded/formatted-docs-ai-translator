import { DEFAULT_CACHE_TAG } from '@apps/common/dist/constants/cache';
import { TranslationLoaderService } from './translation-loader.service';
import type { PrismaService } from '@/nest/db/prisma/prisma.service';
import type { LoggerService } from '@/nest/logger/logger.service';

describe('TranslationLoaderService 실패 이력 저장', () => {
  const createService = () => {
    const client = {
      cacheTag: {
        upsert: jest.fn().mockResolvedValue({ id: 1, name: DEFAULT_CACHE_TAG }),
      },
      translation: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      translationHistory: {
        create: jest.fn().mockResolvedValue(undefined),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (callback: (tx: typeof client) => unknown) => callback(client)),
    } as unknown as PrismaService;

    const logger = {
      error: jest.fn(),
    } as unknown as LoggerService;

    const service = new TranslationLoaderService(prisma, logger);
    const clearSourceCacheSpy = jest
      .spyOn(service, 'clearSourceCache')
      .mockImplementation(() => {});

    return { service, client, clearSourceCacheSpy };
  };

  it('기존 성공 캐시가 있으면 실패 저장 시 current row는 유지하고 history만 추가한다', async () => {
    const { service, client } = createService();
    client.translation.findUnique.mockResolvedValue({
      id: 10,
      source: 'source-text',
      target: '기존 성공 번역',
      success: true,
      cacheTagId: 1,
      cacheTag: { name: DEFAULT_CACHE_TAG },
    });

    await service.saveTranslation(
      'source-text',
      '실패한 번역문',
      false,
      'test-model',
      DEFAULT_CACHE_TAG,
      'placeholder_mismatch'
    );

    expect(client.translation.upsert).not.toHaveBeenCalled();
    expect(client.translationHistory.create).toHaveBeenCalledWith({
      data: {
        translationId: 10,
        source: 'source-text',
        target: '실패한 번역문',
        success: false,
        error: 'placeholder_mismatch',
        model: 'test-model',
        cacheTagId: 1,
      },
    });
  });

  it('기존 성공 캐시가 없으면 실패 저장도 current row를 생성한다', async () => {
    const { service, client } = createService();
    client.translation.findUnique.mockResolvedValue(null);
    client.translation.upsert.mockResolvedValue({
      id: 11,
      source: 'new-source',
      target: '실패한 번역문',
      success: false,
      cacheTagId: 1,
      cacheTag: { name: DEFAULT_CACHE_TAG },
    });

    await service.saveTranslation(
      'new-source',
      '실패한 번역문',
      false,
      'test-model',
      DEFAULT_CACHE_TAG,
      'placeholder_mismatch'
    );

    expect(client.translation.upsert).toHaveBeenCalledTimes(1);
    expect(client.translationHistory.create).toHaveBeenCalledWith({
      data: {
        translationId: 11,
        source: 'new-source',
        target: '실패한 번역문',
        success: false,
        error: 'placeholder_mismatch',
        model: 'test-model',
        cacheTagId: 1,
      },
    });
  });

  it('다중 실패 저장도 기존 성공 current row는 보존한다', async () => {
    const { service, client } = createService();
    client.translation.findUnique
      .mockResolvedValueOnce({
        id: 21,
        source: 'cached-source',
        target: '기존 성공 번역',
        success: true,
        cacheTagId: 1,
        cacheTag: { name: DEFAULT_CACHE_TAG },
      })
      .mockResolvedValueOnce(null);
    client.translation.upsert.mockResolvedValue({
      id: 22,
      source: 'new-source',
      target: '새 실패 번역',
      success: false,
      cacheTagId: 1,
      cacheTag: { name: DEFAULT_CACHE_TAG },
    });

    await service.saveManyTranslations(
      new Map([
        ['cached-source', '실패 번역문 1'],
        ['new-source', '새 실패 번역'],
      ]),
      false,
      'test-model',
      DEFAULT_CACHE_TAG,
      'placeholder_mismatch'
    );

    expect(client.translation.upsert).toHaveBeenCalledTimes(1);
    expect(client.translationHistory.create).toHaveBeenNthCalledWith(1, {
      data: {
        translationId: 21,
        source: 'cached-source',
        target: '실패 번역문 1',
        success: false,
        error: 'placeholder_mismatch',
        model: 'test-model',
        cacheTagId: 1,
      },
    });
    expect(client.translationHistory.create).toHaveBeenNthCalledWith(2, {
      data: {
        translationId: 22,
        source: 'new-source',
        target: '새 실패 번역',
        success: false,
        error: 'placeholder_mismatch',
        model: 'test-model',
        cacheTagId: 1,
      },
    });
  });
});
