import fs from 'fs';
import path from 'path';

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { getDbPath, isProduction } from '../path';
import { runPrismaMigrations } from './run-migrations';

const SQLITE_FILE_PREFIX = 'file:';

const resolveDatabaseUrl = (): string => {
  const dbPath = getDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `${SQLITE_FILE_PREFIX}${dbPath}`;
  }

  return `${SQLITE_FILE_PREFIX}${dbPath}`;
};

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly databaseUrl: string;

  constructor() {
    const url = resolveDatabaseUrl();
    const logLevels: Prisma.LogLevel[] = isProduction ? ['error'] : ['error', 'warn'];

    super({
      log: logLevels,
      datasources: {
        db: { url },
      },
    });

    this.databaseUrl = url;
  }

  /**
   * 모듈이 초기화될 때 호출됩니다.
   * NestJS는 이 async 함수가 완료될 때까지 기다립니다.
   */
  async onModuleInit(): Promise<void> {
    try {
      // 마이그레이션을 *먼저* 실행하고 `await`로 기다립니다.
      if (isProduction) {
        console.log('[PrismaService] Production 모드: 마이그레이션을 시작합니다...');
        await runPrismaMigrations(this.databaseUrl);
        console.log('[PrismaService] 마이그레이션이 완료되었습니다.');
      } else {
        console.log('[PrismaService] Development 모드: onModuleInit 마이그레이션을 건너뜁니다.');
      }

      // 마이그레이션이 완료된 후 데이터베이스에 연결합니다.
      console.log('[PrismaService] 데이터베이스 연결을 시작합니다...');
      await this.$connect();
      console.log('[PrismaService] 데이터베이스 연결에 성공했습니다.');
    } catch (error) {
      console.error('[PrismaService] onModuleInit 중 심각한 오류 발생:', error);
      process.exit(1); // 마이그레이션/연결 실패 시 앱 강제 종료
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
