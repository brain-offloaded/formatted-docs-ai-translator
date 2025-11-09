import { Inject, Injectable } from '@nestjs/common';

import { CacheCommand, CacheCommandHandler, CacheCommandMiddleware } from './cache-command.types';
import { CACHE_COMMAND_HANDLERS } from './command.tokens';

@Injectable()
export class CacheCommandBus {
  private readonly handlerMap = new Map<string, CacheCommandHandler>();
  private readonly middlewares: CacheCommandMiddleware[] = [];

  constructor(
    @Inject(CACHE_COMMAND_HANDLERS)
    handlers: CacheCommandHandler[]
  ) {
    handlers.forEach((handler) => {
      this.handlerMap.set(handler.commandType, handler);
    });
  }

  public registerMiddleware(middleware: CacheCommandMiddleware): void {
    this.middlewares.push(middleware);
  }

  public async execute<C extends CacheCommand<Result>, Result = unknown>(
    command: C
  ): Promise<Result> {
    const handler = this.handlerMap.get(command.type) as CacheCommandHandler<C, Result> | undefined;
    if (!handler) {
      throw new Error(`등록된 핸들러가 없는 캐시 명령입니다: ${command.type}`);
    }

    const invokeHandler = async (): Promise<Result> => handler.execute(command);

    const pipeline = this.middlewares.reduceRight<() => Promise<Result>>(
      (next, middleware) => () => middleware(command, next),
      invokeHandler
    );

    return pipeline();
  }
}
