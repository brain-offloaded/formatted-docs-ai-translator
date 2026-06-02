# Job Management System for Concurrent Translation

## 1. Background

Processing large files sequentially made translation too slow. To address that, the frontend introduces a lightweight job management layer that supports concurrency, cancellation, and progress tracking. The current implementation runs entirely in the renderer on top of React context and hooks, without requiring backend changes.

## 2. Core Components

### 2.1 Job Model (`src/react/services/job-manager/job.ts`)

- `JobStatus` defines `PENDING`, `RUNNING`, `RETRYING`, `SUCCEEDED`, `FAILED`, and `CANCELLED`.
- `Job<T>` includes `id`, `data`, `retryCount`, `result`, and `error`.
- `data` is either a `File` or a string for text input.

### 2.2 `TranslationJobManager` (`src/react/services/job-manager/TranslationJobManager.ts`)

- **Queue and state management**: tracks jobs through an internal `Map` and queue array.
- **Concurrency control**: runs up to `options.concurrency` workers at once. The default is 1 and can be updated at runtime through `updateConfig`.
- **Events**: exposes `onProgress`, `onJobComplete`, and `onAllComplete`.
  - `onProgress` computes total, completed, and failed jobs for UI updates.
  - `onAllComplete` runs once when the queue is empty and resets worker references.
- **Retry and cancellation**: the default retry count is 0. `cancel()` clears the queue and marks running jobs as `CANCELLED`.

### 2.3 React Integration Hooks

- **`useTranslationJobManager`** (`src/react/contexts/translation/useTranslationJobManager.ts`)
  - used from `TranslationProvider`
  - creates the JobManager lazily based on `concurrencyLimit`
  - exposes `cancelTranslation`, `resetJobManager`, and related controls
- **`TranslationContext`** (`src/react/contexts/TranslationContext.tsx`)
  - provides `getJobManager`, `cancelTranslation`, `resetJobManager`
  - also manages `isTranslating`, `uiState`, `resultState`, and related translation state
- **`useTranslator`** (`src/react/hooks/useTranslator.ts`)
  - acquires the JobManager, adds inputs as jobs, and registers listeners
  - applies progress updates to UI state
  - merges results through `TranslationOutput.merge` on completion
  - records failed jobs as `FAILED` and includes their messages in the report

## 3. Execution Flow

1. When the user starts translation, `useTranslator` clears previous results and queues the new jobs.
2. `TranslationJobManager.start(worker)` begins consuming jobs. The worker runs parse -> translate -> apply through `TranslatorEngine` and returns `TranslationOutput`.
3. Each job updates to `SUCCEEDED` or `FAILED`, triggering events that refresh the UI and stores.
4. After all jobs complete, `onAllComplete` prepares ZIP output, single-file output, and success/failure summaries.
5. If the user clicks cancel, `cancelTranslation()` marks queued and running jobs as `CANCELLED` and immediately updates progress and `isTranslating`.

## 4. Concurrency and Configuration

- Concurrency is set in `TranslationProvider` from `useConfigStore().requestsPerMinute`, clamped between 1 and 5.
- When settings change and a new translation starts, `useTranslationJobManager` updates the existing JobManager through `updateConfig`.
- Retry counts can be tuned through `options.retries`, and backoff strategies can be added by extending `TranslationJobManager.processJob`.

## 5. Extension Tips

- **Finer-grained progress**: current progress is based on completed and failed jobs only. If unit-level progress is needed, wire `ProgressCallback` into the worker and include it in JobManager events.
- **Weighted results**: if some jobs should contribute differently to progress or reporting, adjust `onProgress` or `TranslationOutput.merge`.
- **Error handling**: use the `error` field on `FAILED` jobs to produce user-facing messages in components such as `TranslationError`.

The current design provides concurrent translation, partial failure reporting, and instant cancellation entirely in the frontend, while allowing new translation types to reuse the same job pipeline.
