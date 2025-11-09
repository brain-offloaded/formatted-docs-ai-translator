import type { Prisma } from '@prisma/client';

import type { PrismaService } from '@/nest/db/prisma/prisma.service';
import type { LoggerService } from '@/nest/logger/logger.service';

describe('UnitOfWork', () => {
  let prisma: { $transaction: jest.Mock };
  let logger: Pick<LoggerService, 'error'>;
  let unitOfWork: import('./unit-of-work.service').UnitOfWork;
  let txClient: Prisma.TransactionClient;

  beforeEach(async () => {
    txClient = {} as Prisma.TransactionClient;
    prisma = {
      $transaction: jest.fn(async (callback: (client: Prisma.TransactionClient) => unknown) =>
        callback(txClient)
      ),
    };
    logger = {
      error: jest.fn(),
    };

    const { UnitOfWork } = await import('./unit-of-work.service');
    unitOfWork = new UnitOfWork(prisma as unknown as PrismaService, logger as LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('커밋 이후에 후처리 훅을 한 번만 실행한다', async () => {
    const postCommitHook = jest.fn();

    const result = await unitOfWork.execute(async (client, context) => {
      expect(client).toBe(txClient);
      context.registerPostCommitHook(postCommitHook);
      return 42;
    });

    expect(result).toBe(42);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(postCommitHook).toHaveBeenCalledTimes(1);
  });

  it('작업 중 예외가 발생하면 후처리 훅을 실행하지 않는다', async () => {
    const postCommitHook = jest.fn();
    const failure = new Error('boom');

    (prisma.$transaction as jest.Mock).mockImplementationOnce(async (callback) => {
      await callback(txClient);
      throw failure;
    });

    await expect(
      unitOfWork.execute(async (_client, context) => {
        context.registerPostCommitHook(postCommitHook);
      })
    ).rejects.toThrow(failure);

    expect(postCommitHook).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});
