import 'reflect-metadata';
import { OnModuleInit } from '@nestjs/common';
import { LoggerService } from '@/nest/logger/logger.service';
import { ipcMain } from 'electron';

import { IpcChannel } from './ipc.channel';

const IPC_METADATA_KEY = 'ipc:channel';

export function HandleIpc(channel: IpcChannel) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(IPC_METADATA_KEY, channel, target as object, propertyKey);
    return descriptor;
  };
}

export class IpcHandler implements OnModuleInit {
  protected readonly logger: LoggerService;

  onModuleInit() {
    this.registerIpcHandlers();
  }

  private registerIpcHandlers() {
    const prototype = Object.getPrototypeOf(this);
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (prop) => prop !== 'constructor' && typeof prototype[prop] === 'function'
    );

    for (const methodName of methodNames) {
      const channel = Reflect.getMetadata(IPC_METADATA_KEY, prototype, methodName);

      if (channel) {
        const originalMethod = prototype[methodName];

        ipcMain.handle(channel, async (event, ...args) => {
          try {
            return await originalMethod.call(this, event, ...args);
          } catch (error) {
            this.logger.error(`Error in IPC handler for channel "${channel}":`, { error });
            return {
              success: false,
              message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
            };
          }
        });
      }
    }
  }
}
