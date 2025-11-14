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
      .catch((error) => this.emit('error', error));

    callback();
  }
}
