export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  CANCELLED = 'CANCELLED',
}

export interface Job<T> {
  id: string;
  data: T;
  status: JobStatus;
  retryCount: number;
  result?: unknown;
  error?: unknown;
}
