import { Job } from './job';

export interface JobManagerOptions {
  concurrency: number;
  retries: number;
}

export interface JobManagerEvents<T> {
  onProgress: (progress: {
    total: number;
    completed: number;
    failed: number;
    cancelled: number;
  }) => void;
  onJobComplete: (job: Job<T>) => void;
  onAllComplete: (results: Job<T>[]) => void;
}
