import DataLoader from 'dataloader';
import TransportStream from 'winston-transport';
import type { TransformableInfo } from 'logform';

import { PrismaService } from '@/nest/db/prisma/prisma.service';

type LogBatchItem = {
  level: string;
  message: string;
  context?: string | null;
  metadata?: string | null;
};

export interface PrismaLogTransportOptions extends TransportStream.TransportStreamOptions {
  prisma: PrismaService;
  batchSize?: number;
}

export class PrismaLogTransport extends TransportStream {
  private readonly createLoader: DataLoader<LogBatchItem, void>;

  constructor(options: PrismaLogTransportOptions) {
    super(options);
    this.createLoader = new DataLoader(
      async (items: readonly LogBatchItem[]) => {
        if (items.length === 0) {
          return [];
        }

        await options.prisma.log.createMany({
          data: items.map((item) => ({
            level: item.level,
            message: item.message,
            context: item.context ?? null,
            metadata: item.metadata ?? null,
          })),
        });

        return items.map(() => undefined);
      },
      {
        maxBatchSize: options.batchSize ?? 100,
        cache: false,
      }
    );
  }

  log(
    info: TransformableInfo & { logMetadata?: Record<string, unknown>; context?: string },
    callback: () => void
  ): void {
    setImmediate(() => this.emit('logged', info));

    const metadata = info.logMetadata ?? null;
    const metadataContext =
      metadata && typeof metadata.context === 'string' ? metadata.context : null;
    const context = metadataContext ?? (typeof info.context === 'string' ? info.context : null);
    const serializedMetadata = metadata ? JSON.stringify(metadata) : null;

    const level = typeof info.level === 'string' ? info.level : String(info.level);
    const message = typeof info.message === 'string' ? info.message : String(info.message);

    this.createLoader
      .load({
        level,
        message,
        context,
        metadata: serializedMetadata,
      })
      .catch((error) => {
        // 에러 이벤트를 그대로 방출하면 프로세스가 죽을 수 있으므로 최대한 내부에서 처리합니다.
        console.error('[PrismaLogTransport] 로그 저장 실패', error);
      });

    callback();
  }
}
