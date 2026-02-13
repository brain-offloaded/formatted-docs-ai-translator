import { v4 as uuidv4 } from 'uuid';
import { Job, JobStatus } from './job';
import { JobManagerOptions, JobManagerEvents } from './job-manager.types';

const MAX_RETRIES = 0;

type Worker<T> = (job: Job<T>) => Promise<unknown>;

export class TranslationJobManager<T> {
  private jobs: Map<string, Job<T>> = new Map();
  private queue: string[] = [];
  private runningWorkers = 0;
  private options: JobManagerOptions;
  private eventHandlers: Partial<JobManagerEvents<T>> = {};
  private worker: Worker<T> | null = null;
  private cancellationRequested = false;

  constructor(options: Partial<JobManagerOptions> = {}) {
    this.options = {
      concurrency: options.concurrency || 1,
      retries: options.retries || MAX_RETRIES,
    };
  }

  updateConfig(options: Partial<JobManagerOptions>): void {
    this.options = {
      ...this.options,
      ...options,
      concurrency: options.concurrency ?? this.options.concurrency,
      retries: options.retries ?? this.options.retries,
    };
  }

  on<K extends keyof JobManagerEvents<T>>(event: K, handler: JobManagerEvents<T>[K]): void {
    this.eventHandlers[event] = handler;
  }

  private emit<K extends keyof JobManagerEvents<T>>(
    event: K,
    ...args: Parameters<JobManagerEvents<T>[K]>
  ): void {
    const handler = this.eventHandlers[event];
    if (handler) {
      (handler as (...args: unknown[]) => void)(...args);
    }
  }

  add(data: T[]): Job<T>[] {
    if (data.length > 0) {
      this.cancellationRequested = false;
    }

    const newJobs = data.map((item) => {
      const job: Job<T> = {
        id: uuidv4(),
        data: item,
        status: JobStatus.PENDING,
        retryCount: 0,
      };
      this.jobs.set(job.id, job);
      this.queue.push(job.id);
      return job;
    });
    return newJobs;
  }

  start(worker: Worker<T>): void {
    if (this.worker) {
      console.warn('Job manager is already running.');
      return;
    }
    this.cancellationRequested = false;
    this.worker = worker;
    this.runNextJobInQueue();
  }

  cancel(options: { silent?: boolean } = {}): void {
    const { silent = false } = options;

    this.cancellationRequested = true;
    this.queue = [];

    let hasStateChange = false;

    this.jobs.forEach((job) => {
      if (
        job.status === JobStatus.PENDING ||
        job.status === JobStatus.RUNNING ||
        job.status === JobStatus.RETRYING
      ) {
        job.status = JobStatus.CANCELLED;
        hasStateChange = true;

        if (!silent) {
          this.emit('onJobComplete', job);
        }
      }
    });

    if (!silent && hasStateChange) {
      this.emitProgress();
      this.checkAndEmitAllComplete();
    }

    if (!silent && !hasStateChange) {
      this.worker = null;
    }
  }

  reset(): void {
    this.cancel({ silent: true });

    this.jobs.clear();
    this.queue = [];
    this.runningWorkers = 0;
    this.worker = null;
    this.cancellationRequested = false;
  }

  private runNextJobInQueue(): void {
    while (this.runningWorkers < this.options.concurrency && this.queue.length > 0) {
      const jobId = this.queue.shift();
      if (jobId) {
        this.runningWorkers++;
        this.processJob(jobId, this.worker!);
      }
    }
  }

  private async processJob(jobId: string, worker: Worker<T>): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== JobStatus.PENDING) {
      this.runningWorkers--;
      this.runNextJobInQueue();
      return;
    }

    job.status = JobStatus.RUNNING;
    this.emitProgress();

    try {
      const result = await worker(job);
      if (!this.isJobCancelled(job)) {
        job.result = result;
        job.status = JobStatus.SUCCEEDED;
      }
    } catch (error) {
      if (this.isJobCancelled(job)) {
        // 취소된 작업은 추가 처리를 건너뛴다.
      } else if (job.retryCount < this.options.retries) {
        job.retryCount++;
        job.status = JobStatus.RETRYING;
        this.queue.unshift(jobId); // Add back to the front of the queue for retry
      } else {
        job.error = error;
        job.status = JobStatus.FAILED;
      }
    } finally {
      this.runningWorkers--;
      const isCancelled = this.isJobCancelled(job);

      if (!isCancelled) {
        this.emit('onJobComplete', job);
        this.emitProgress();

        if (job.status !== JobStatus.RETRYING) {
          this.checkAndEmitAllComplete();
        }
      }

      this.runNextJobInQueue();
    }
  }

  private emitProgress(): void {
    const total = this.jobs.size;
    let succeeded = 0;
    let failed = 0;
    let cancelled = 0;

    this.jobs.forEach((job) => {
      if (job.status === JobStatus.SUCCEEDED) succeeded++;
      if (job.status === JobStatus.FAILED) failed++;
      if (job.status === JobStatus.CANCELLED) cancelled++;
    });

    this.emit('onProgress', {
      total,
      completed: succeeded,
      failed,
      cancelled,
    });
  }

  private checkAndEmitAllComplete(): void {
    const total = this.jobs.size;
    const finished = Array.from(this.jobs.values()).filter(
      (j) =>
        j.status === JobStatus.SUCCEEDED ||
        j.status === JobStatus.FAILED ||
        j.status === JobStatus.CANCELLED
    ).length;

    if (total === finished) {
      this.emit('onAllComplete', Array.from(this.jobs.values()));
      this.worker = null; // Reset worker after all jobs are done
    }
  }

  hasActiveJobs(): boolean {
    if (this.runningWorkers > 0) {
      return true;
    }

    if (this.queue.length > 0) {
      return true;
    }

    return Array.from(this.jobs.values()).some((job) =>
      [JobStatus.PENDING, JobStatus.RUNNING, JobStatus.RETRYING].includes(job.status)
    );
  }

  isCancellationRequested(): boolean {
    return this.cancellationRequested;
  }

  private isJobCancelled(job: Job<T>): boolean {
    return job.status === JobStatus.CANCELLED;
  }
}
