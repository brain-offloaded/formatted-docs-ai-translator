import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { In, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import winston from 'winston';

import { errorToString } from '../../utils/error-stringify';
import { Log } from '../db/typeorm/entities/log.entity';
import { TypeOrmService } from '../db/typeorm/typeorm.service';

import { LogMetadata, GetLogsParams, GetLogsResult } from './logger.types';
import { logger } from '../../utils/logger';

@Injectable()
export class LoggerService {
  private winstonLogger: winston.Logger;
  private idLoader: DataLoader<number, Log | null>;
  private createLoader: DataLoader<
    { level: string; message: string; context?: string | null; metadata?: string | null },
    void
  >;

  constructor(private readonly orm: TypeOrmService) {
    this.winstonLogger = this.initializeWinstonLogger();
    this.idLoader = this.initializeDataLoader();
    this.createLoader = this.initializeCreateLoader();
  }

  private initializeWinstonLogger(): winston.Logger {
    return logger;
  }

  private initializeDataLoader(): DataLoader<number, Log | null> {
    return new DataLoader<number, Log | null>(
      async (ids) => {
        try {
          const logs = await this.orm.log.find({
            where: {
              id: In(ids as number[]),
            },
          });

          const logMap = new Map<number, Log | null>(logs.map((log: Log) => [log.id, log]));

          return ids.map((id) => logMap.get(id) ?? null);
        } catch (error) {
          this.error('ID로 로그 배치 조회 중 오류:', { error });
          return ids.map(() => null);
        }
      },
      {
        maxBatchSize: 100,
        cache: true,
        cacheMap: new Map(),
      }
    );
  }

  private initializeCreateLoader(): DataLoader<
    {
      level: string;
      message: string;
      context?: string | null;
      metadata?: string | null;
    },
    void
  > {
    return new DataLoader(
      async (
        items: readonly {
          level: string;
          message: string;
          context?: string | null;
          metadata?: string | null;
        }[]
      ) => {
        try {
          // TypeORM에서는 createMany가 없으므로 여러 개의 로그를 개별적으로 만들고 한 번에 저장합니다
          const logs = items.map((item) =>
            this.orm.log.create({
              level: item.level,
              message: item.message,
              context: item.context,
              metadata: item.metadata,
            })
          );

          await this.orm.log.save(logs);
          return items.map(() => undefined);
        } catch (error) {
          this.winstonLogger.error('로그 배치 생성 중 오류:', { error });
          throw error;
        }
      },
      {
        maxBatchSize: 100,
        cache: false,
      }
    );
  }

  private async saveToDb(
    level: string,
    message: string,
    context?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.createLoader.load({
        level,
        message,
        context: context || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });
    } catch (error) {
      this.winstonLogger.error('로그 DB 저장 실패:', { error });
    }
  }

  /**
   * 클라이언트 검색 요청에 맞게 로그를 조회합니다.
   */
  async getLogs(request: GetLogsParams): Promise<GetLogsResult> {
    try {
      const { page, itemsPerPage, searchParams } = request;
      const skip = (page - 1) * itemsPerPage;
      const take = itemsPerPage;

      // where 조건을 동적으로 구성
      const whereCondition: Record<string, unknown> = {};

      // 로그 레벨 필터링 - 비어있지 않은 경우에만 조건 추가
      if (searchParams.levels && searchParams.levels.length > 0) {
        whereCondition.level = In(searchParams.levels);
      }

      // 날짜 필터링 - 시작 날짜와 종료 날짜가 모두 있는 경우 Between 사용
      if (searchParams.startDate && searchParams.endDate) {
        const startDate = this.parseDate(searchParams.startDate);
        startDate.setHours(0, 0, 0, 0); // 하루의 시작

        const endDate = this.parseDate(searchParams.endDate);
        endDate.setHours(23, 59, 59, 999); // 하루의 끝

        whereCondition.timestamp = Between(startDate, endDate);
      }
      // 시작 날짜만 있는 경우
      else if (searchParams.startDate) {
        const startDate = this.parseDate(searchParams.startDate);
        startDate.setHours(0, 0, 0, 0); // 하루의 시작
        whereCondition.timestamp = MoreThanOrEqual(startDate);
      }
      // 종료 날짜만 있는 경우
      else if (searchParams.endDate) {
        const endDate = this.parseDate(searchParams.endDate);
        endDate.setHours(23, 59, 59, 999); // 하루의 끝
        whereCondition.timestamp = LessThanOrEqual(endDate);
      }

      // 전체 개수와 로그 데이터 조회
      const [logs, totalItems] = await this.orm.log.findAndCount({
        where: whereCondition,
        order: { timestamp: 'DESC' },
        skip,
        take,
      });

      return {
        logs: logs.map((log: Log) => ({
          id: log.id,
          level: log.level,
          message: log.message,
          context: log.context,
          metadata: log.metadata,
          timestamp:
            log.timestamp instanceof Date
              ? log.timestamp.toISOString()
              : new Date(log.timestamp).toISOString(),
        })),
        totalItems,
        success: true,
        message: '로그 조회 성공',
      };
    } catch (error) {
      this.error('로그 조회 중 오류 발생', { error });
      throw error;
    }
  }

  /**
   * 여러 가능한 날짜 형식을 파싱합니다.
   * YYYY/MM/DD, YYYY-MM-DD 형식을 모두 지원합니다.
   */
  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();

    try {
      // 날짜 형식 정규화: 슬래시를 하이픈으로 변환
      const normalizedDateStr = dateStr.replace(/\//g, '-');
      const date = new Date(normalizedDateStr);

      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        // YYYY/MM/DD 형식 파싱 시도
        const parts = dateStr.split(/[/-]/);
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // JavaScript의 월은 0부터 시작
          const day = parseInt(parts[2], 10);
          return new Date(year, month, day);
        }

        throw new Error(`Invalid date format: ${dateStr}`);
      }

      return date;
    } catch (error) {
      this.warn(`날짜 파싱 실패: ${dateStr}`, { error });
      return new Date(); // 기본값으로 현재 날짜 반환
    }
  }

  public async deleteLogs(logIds: number[]): Promise<void> {
    try {
      await this.orm.log.delete(logIds);
      this.clearIdCaches(logIds);
    } catch (error) {
      this.winstonLogger.error('로그 삭제 중 오류:', { error });
      throw error;
    }
  }

  public async deleteAllLogs(searchParams: GetLogsParams['searchParams']): Promise<void> {
    try {
      // where 조건을 동적으로 구성
      const whereCondition: Record<string, unknown> = {};

      // 로그 레벨 필터링 - 비어있지 않은 경우에만 조건 추가
      if (searchParams.levels && searchParams.levels.length > 0) {
        whereCondition.level = In(searchParams.levels);
      }

      // 날짜 필터링 - 시작 날짜와 종료 날짜가 모두 있는 경우 Between 사용
      if (searchParams.startDate && searchParams.endDate) {
        const startDate = this.parseDate(searchParams.startDate);
        startDate.setHours(0, 0, 0, 0); // 하루의 시작

        const endDate = this.parseDate(searchParams.endDate);
        endDate.setHours(23, 59, 59, 999); // 하루의 끝

        whereCondition.timestamp = Between(startDate, endDate);
      }
      // 시작 날짜만 있는 경우
      else if (searchParams.startDate) {
        const startDate = this.parseDate(searchParams.startDate);
        startDate.setHours(0, 0, 0, 0); // 하루의 시작
        whereCondition.timestamp = MoreThanOrEqual(startDate);
      }
      // 종료 날짜만 있는 경우
      else if (searchParams.endDate) {
        const endDate = this.parseDate(searchParams.endDate);
        endDate.setHours(23, 59, 59, 999); // 하루의 끝
        whereCondition.timestamp = LessThanOrEqual(endDate);
      }

      // 삭제할 로그들의 ID 조회
      const logsToDelete = await this.orm.log.find({
        where: whereCondition,
        select: ['id'],
      });
      const logIdsToDelete = logsToDelete.map((log) => log.id);

      // 조회된 ID로 로그 삭제 및 캐시 제거
      if (logIdsToDelete.length > 0) {
        await this.deleteLogs(logIdsToDelete);
      }
    } catch (error) {
      this.winstonLogger.error('모든 로그 삭제 중 오류:', { error });
      throw error;
    }
  }

  public async loadById(id: number): Promise<Log | null> {
    try {
      return await this.idLoader.load(id);
    } catch (error) {
      this.winstonLogger.error('ID로 로그 로드 중 오류:', { error, id });
      return null;
    }
  }

  public async loadManyById(ids: number[]): Promise<Array<Log | null>> {
    try {
      const results = await this.idLoader.loadMany(ids);
      return results.map((result) => (result instanceof Error ? null : result));
    } catch (error) {
      this.winstonLogger.error('다중 ID로 로그 로드 중 오류:', { error });
      return ids.map(() => null);
    }
  }

  public clearCache(): void {
    this.idLoader.clearAll();
  }

  public clearIdCaches(ids: number[]): void {
    ids.forEach((id) => this.clearIdCache(id));
  }

  public clearIdCache(id: number): void {
    this.idLoader.clear(id);
  }

  error(message: string, metadata?: LogMetadata, ...args: unknown[]): void {
    if (metadata?.error && typeof metadata.error === 'object') {
      metadata.error = errorToString(metadata.error);
    }
    this.winstonLogger.error(message, metadata, ...args);
    this.saveToDb('error', message, metadata?.context, metadata);
  }

  warn(message: string, metadata?: LogMetadata, ...args: unknown[]): void {
    this.winstonLogger.warn(message, metadata, ...args);
    this.saveToDb('warn', message, metadata?.context, metadata);
  }

  info(message: string, metadata?: LogMetadata, ...args: unknown[]): void {
    this.winstonLogger.info(message, metadata, ...args);
    this.saveToDb('info', message, metadata?.context, metadata);
  }

  debug(message: string, metadata?: LogMetadata, ...args: unknown[]): void {
    this.winstonLogger.debug(message, metadata, ...args);
    this.saveToDb('debug', message, metadata?.context, metadata);
  }

  // 함수형 로깅 헬퍼 메소드
  logError(error: Error, context?: string): void {
    this.error(error.message, {
      message: error.message,
      stack: error.stack,
      context,
    });
  }

  logInfo(message: string, meta?: Record<string, unknown>): void {
    this.info(message, meta);
  }

  logWarn(message: string, meta?: Record<string, unknown>): void {
    this.warn(message, meta);
  }

  logDebug(message: string, meta?: Record<string, unknown>): void {
    this.debug(message, meta);
  }
}
