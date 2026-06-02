# Unified Domain Model Reference

This document summarizes the core domain objects that make up the Unified Architecture translation pipeline. It follows the actual code structure closely so you can quickly understand the role and main API of each class when extending `TranslatorFactory`, parsers, or appliers.

## TranslationInput

- **Path**: [`src/react/unified/domain/translation-input.ts`](src/react/unified/domain/translation-input.ts)
- **Shape**:

  ```ts
  export class TranslationInput<T = unknown> {
    constructor(
      public readonly content: string | File,
      public readonly options: T,
      public readonly aiConfig: AiTranslatorConfig,
      public readonly promptPresetContent?: string
    ) {}
  }
  ```

- `content` accepts exactly one string or one `File`. Multi-file uploads are split into per-file jobs by [`TranslationJobManager`](src/react/services/job-manager/TranslationJobManager.ts), and each job receives its own `TranslationInput`.
- `options` carries the parser DTO directly, including any custom fields that extend `BaseParseOptionsDto`.
- `aiConfig` bundles translator settings such as provider, API key, and preset name. The `useTranslator` hook constructs it from the config store and user input.
- `promptPresetContent` is an optional advanced prompt preset string passed through to the translator.

## TranslationUnit

- **Path**: [`src/react/unified/domain/translation-unit.ts`](src/react/unified/domain/translation-unit.ts)
- **Purpose**: the minimal translatable unit produced by parsers, such as a sentence or subtitle line.
- **Fields**:
  - `key`: identifier used to map the translated result back into the original structure
  - `source`: source text
  - `target`: translated text, initially empty if needed

## TranslationOutput

- **Path**: [`src/react/unified/domain/translation-output.ts`](src/react/unified/domain/translation-output.ts)
- **Key features**:
  - stores multiple `TranslationResult` entries and merges pipeline results through `TranslationOutput.merge`
  - returns all results or a single result through `getResults` and `getResult`
  - summarizes success and failure by original file through `getAggregatedReport`
  - generates download-ready blobs through `toZip` and `getSingleFile`

## TranslationStrategy and TranslatorEngine

- **Strategy interface**: [`src/react/unified/domain/translation-strategy.ts`](src/react/unified/domain/translation-strategy.ts)
- **Engine implementation**: [`src/react/unified/engine/translator-engine.ts`](src/react/unified/engine/translator-engine.ts)
- `TranslationStrategy` groups the parser, translator, and applier for a translation type.
- `TranslatorEngine.translate` runs this order with a fixed progress callback contract:
  1. `parser.parse(input)`
  2. `translator.translate(units, aiConfig, promptPresetContent, sourceFilePath)`
  3. `applier.apply(input, translatedUnits)`
- For file input, the engine extracts `path` from the Electron `File` object and forwards it to the translator when a local-file-based translator needs it.

## Integration with the Job Manager

- **Path**: [`src/react/services/job-manager/TranslationJobManager.ts`](src/react/services/job-manager/TranslationJobManager.ts)
- When users select multiple files, `useTranslator` queues each one as a separate `Job<File | string>`.
- Parsers and appliers only need to handle a single input at a time; concurrency is handled by `TranslationJobManager`.
- Job status follows `PENDING -> RUNNING -> (SUCCEEDED | FAILED | CANCELLED)`.
- After every job completes, results are merged, reports are created, and ZIP or single-file downloads are prepared automatically.
