import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '@/nest/db/prisma/prisma.service';
import { LoggerService } from '../../logger/logger.service';

export type PostCommitHook = () => Promise<void> | void;

export interface TransactionContext {
  registerPostCommitHook(hook: PostCommitHook): void;
}

@Injectable()
export class UnitOfWork {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService
  ) {}

  public async execute<T>(
    work: (client: Prisma.TransactionClient, context: TransactionContext) => Promise<T>
  ): Promise<T> {
    const postCommitHooks: PostCommitHook[] = [];
    const context: TransactionContext = {
      registerPostCommitHook: (hook: PostCommitHook) => {
        if (typeof hook !== 'function') {
          return;
        }
        postCommitHooks.push(hook);
      },
    };

    try {
      const result = await this.prisma.$transaction(async (client) => work(client, context));

      for (const hook of postCommitHooks) {
        try {
          await hook();
        } catch (error) {
          this.logger.error('트랜잭션 후처리 실행 중 오류가 발생했습니다.', {
            error,
          });
        }
      }

      return result;
    } catch (error) {
      this.logger.error('UnitOfWork.execute 실행 중 오류가 발생했습니다.', { error });
      throw error;
    }
  }
}
