export interface CacheCommand<Result = unknown> {
  readonly type: string;
  readonly __resultType__?: Result;
}

export interface CacheCommandHandler<C extends CacheCommand = CacheCommand, Result = unknown> {
  readonly commandType: string;
  execute(command: C): Promise<Result>;
}

export type CacheCommandMiddleware = <Result>(
  command: CacheCommand<Result>,
  next: () => Promise<Result>
) => Promise<Result>;
