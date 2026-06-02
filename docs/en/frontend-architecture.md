# Frontend Architecture

This document summarizes the frontend structure of Formatted Docs AI Translator. The current codebase is designed to support multiple translation types dynamically inside the Electron renderer (React), including text, JSON, CSV, subtitles, images, and more.

## Core Principles

1. **Unified translation pipeline**: every translation runs through `Parse -> Translate -> Apply`, and [`TranslatorEngine`](src/react/unified/engine/translator-engine.ts) executes a `TranslationStrategy` combination in order.
2. **Config-driven UI generation**: translators and option panels are generated from the definitions in [`src/react/config/translation-configs/`](src/react/config/translation-configs/), so adding a new type usually requires only minimal UI changes.
3. **Job-managed concurrency**: translation requests are queued by `TranslationJobManager`, while the `useTranslator` hook manages state updates and cancellation.

## Directory Overview (`src/react`)

- `unified/`
  - `parser/`, `translator/`, `applier/`: implementations for each pipeline stage
  - `engine/`: `TranslatorEngine` and related types
  - `domain/`: shared models such as `TranslationInput`, `TranslationUnit`, and `TranslationOutput`
- `config/translation-configs/`
  - labels, input form options, and parser options for each translation type
- `factories/`
  - [`translation-strategy-factory.ts`](src/react/factories/translation-strategy-factory.ts): builds the parser/translator/applier combination for each `TranslationType`
  - [`TranslatorFactory.tsx`](src/react/factories/TranslatorFactory.tsx): memoizes and renders config-based translator UIs
  - [`ParseOptionsFactory.tsx`](src/react/factories/ParseOptionsFactory.tsx): builds parser option panels
- `views/`
  - `TranslateView/`: the main translation screen and related hooks
  - `AdvancedImageViewer/`, `ImageViewerView/`: viewers for image translation results
- `contexts/`
  - [`TranslationContext.tsx`](src/react/contexts/TranslationContext.tsx): global translation state, job management, snackbar handling, and file state
  - `translation/types.ts`: `TranslationType` and UI state types
- `services/job-manager/`
  - `TranslationJobManager.ts`, `job.ts`, `job-manager.types.ts`: concurrency management for translation jobs

## Unified Core Flow

1. **Parsing**
   - An `IParser` converts the input (`string` or `File[]`) into `TranslationUnit[]`.
   - Examples: `PlainTextParser`, `JsonParser`, `ImageParser`.
2. **Translation**
   - An `ITranslator` sends the units to the AI service.
   - `TextArrayTranslator` calls `IpcChannel.TranslateTextArray` to translate a text array.
   - `ImageTranslator` returns OCR and translation output in block units.
3. **Apply**
   - An `IApplier` reassembles the translated units into the original format.
   - The result is returned as `TranslationOutput`, which can then be used as ZIP output or text/Blob output.

## Factory-Based UI Composition

- **`TranslatorFactory`**
  - uses the `translator` options registered in `translation-configs` to build `BaseTranslator`
  - can configure labels, file extensions, placeholders, and output formatting
- **`ParseOptionsFactory`**
  - uses the same configuration's `parser.options` to render `BaseParseOptions`
  - the `OptionItem` array defines the dynamic form structure
- **`useTranslatorFactories`**
  - resolves the translator component, options component, and labels for the current `TranslationType` inside `TranslateView`

## Job Management and State Flow

1. `TranslationProvider` creates `TranslationJobManager` lazily through `useTranslationJobManager`. Concurrency is derived from `useConfigStore().requestsPerMinute`.
2. The `useTranslator` hook calls `getJobManager()`, queues file or text input as jobs, and subscribes to `onProgress` and `onAllComplete` to update UI state such as `translationProgress`, `completed`, and `failed`.
3. When jobs finish, `TranslationOutput.merge` aggregates the results and `TranslationContext` stores ZIP blobs, single-file blobs, and summary reports.
4. `cancelTranslation()` calls `TranslationJobManager.cancel()`, moving all `PENDING` or `RUNNING` jobs to `CANCELLED`.

## `TranslateView` Summary

1. The user selects a translation type from the dropdown, which updates `translationType` in `TranslationContext`.
2. `useTranslatorFactories` returns the matching translator and options components.
3. When the user starts translation, `useTranslator` enqueues the input and updates progress and result state.
4. After all jobs complete, `TranslationContext` stores the result and result components such as `ImageTranslator` render download and summary UI.

## Extension Notes

- When adding a new type, check `TranslationType`, `translation-strategy-factory`, `translation-configs`, and `TranslationTypeMapping` together.
- If job behavior for multi-file translation needs to change, update `TranslationJobManager` or `useTranslationJobManager` for concurrency and retry policy changes.
- If new IPC routes are introduced, update both the `ipcClient` wrapper and the Nest DTOs.

## Known Issue

- **Scattered business logic**: domain rules such as cache tag registration, translation result summarization, and ZIP downloads are spread across components and hooks. That makes backend API changes expensive because several files must be updated together. Centralizing those rules in shared services would reduce that coupling.
