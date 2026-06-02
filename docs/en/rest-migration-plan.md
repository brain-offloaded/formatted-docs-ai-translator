# IPC to REST Migration Roadmap

## 1. Base Nest HTTP Application Setup

- [x] Replace `NestFactory.createApplicationContext` with `NestFactory.create` in `bootstrap.ts` and run the HTTP server through `FastifyAdapter`.
- [x] Register `ValidationPipe` globally with safe options such as `whitelist`, `transform`, and `forbidNonWhitelisted`.
- [x] Configure `ClassSerializerInterceptor` and `SerializeOptions` globally to control response serialization.
- [x] Confirm `class-transformer` and `class-validator` dependencies are present and keep the existing versions.
- [x] Add Swagger and expose API docs at `/swagger`, generating the schema through `SwaggerModule.createDocument`.

## 2. Swagger-Based Codegen Pipeline

- [x] Implement `src/nest/create-swagger.ts` to bootstrap Nest and write Swagger JSON to disk.
- [x] Add a script in `package.json` or `scripts/` to automate Swagger generation.
- [x] Create a renderer-side codegen script that uses Swagger JSON as input and outputs generated clients under `src/react/api/generated`.
- [x] Add a codegen tool configuration to generate type-safe clients.
- [x] Prepare the Electron main process to import Swagger-based generated clients and use HTTP instead of IPC.
- [x] Document the rule that generated Swagger models are the single source of truth for shared API types, replacing manual definitions in `src/common` or `src/types`.

## 3. Module-by-Module IPC -> REST Migration Loop

Each module follows the steps below. After each conversion, run `yarn build` and `yarn lint`, then commit the result.

### 1. Identify the scope

- Find the IPC channel (`ipc.channel.ts`) and handler (`ipc.handler.ts`) that will move.
- Identify related DTOs, services, and utilities.

### 2. Convert the server side

- Move IPC handler logic into Nest controller methods and map DTOs with `@Body`, `@Query`, and `@Param`.
- For numeric `@Param()` values, do not rely only on `enableImplicitConversion`; use `@Type(() => Number)` explicitly in DTO fields.
- Define response serialization explicitly through `@SerializeOptions({ type: DTO })` and DTO decorators such as `@Expose` and `@Type`.
- Keep service-layer calls but adapt them to HTTP response semantics.
- Make every HTTP response DTO inherit from `BaseResponseDto`, not from IPC-only types.
- Put every request and response shape into dedicated DTO files and annotate them fully for Swagger and runtime validation.
- For nested objects, split them into DTO classes and annotate both `@Type` and Swagger metadata explicitly.
- If a payload is too complex to model cleanly, split it into simpler REST endpoints instead of leaking `any` into the API contract.
- Use `@ApiOkResponse` to expose response shapes in Swagger.
- Remove stale manual types under `src/common` when Swagger-generated types should replace them.
- Register the new controllers in the relevant Nest modules.

### 3. Replace the client side

- Run `yarn codegen` first so renderer code uses the newest generated client.
- Replace IPC call sites with generated HTTP client calls.
- In the frontend, use generated models under `src/react/api/generated/models` instead of manual types under `src/types`.
- Remove obsolete IPC code after replacement.

### 4. Validate and QA

- Run the main Electron flows for the module and confirm HTTP behavior works end to end.
- Run `yarn build` and `yarn lint`, and update tests if necessary.
- Record QA results and move on to the next module.

## Progress Checklist by IPC Function

### Translation - image

- [x] `translateImage`

### Settings

- [x] `getSetting`
- [x] `updateSetting`
- [x] `getAllSettings`
- [x] `deleteSetting`

### Logging

- [x] `getLogs`
- [x] `getLogDetail`
- [x] `deleteLogs`
- [x] `deleteAllLogs`

### Translation prompt presets

- [x] `getPromptPresets`
- [x] `getPromptPresetDetail`
- [x] `createPromptPreset`
- [x] `updatePromptPreset`
- [x] `deletePromptPreset`

### Translator

- [x] `translateTextArray`

### Example presets

- [x] `getExamplePresets`
- [x] `getExamplePresetDetail`
- [x] `loadExamplePreset`
- [x] `createExamplePreset`
- [x] `deleteExamplePreset`
- [x] `updateExamplePreset`

### Temporary workspace

- [x] `cleanupTempWorkspace`

### Cache / translation history

- [x] `getTranslations`
- [x] `getTranslationHistory`
- [x] `updateTranslation`
- [x] `updateTranslationCacheTag`
- [x] `deleteTranslation`
- [x] `deleteAllTranslations`
- [x] `exportTranslations`
- [x] `importTranslations`
- [x] `getCacheTags`
- [x] `deleteCacheTag`

### Common Electron/system operations

- [x] `openZipInAdvancedViewerDialog` - intentionally excluded from REST
- [x] `openExternalUrl` - intentionally excluded from REST
- [x] `openAdvancedViewer` - intentionally excluded from REST
- [x] `advancedViewerLoadZip` - intentionally excluded from REST

## 4. Shared Considerations

- Keep functional behavior equivalent while removing the IPC path completely where migration applies.
- Keep Swagger documents and generated clients consistent after every module conversion.
- Since the Electron app talks only to localhost, keep security and auth settings minimal and scoped to the local scenario.
- Commit changes module by module and describe scope and testing clearly in PRs.
- After migration completes, remove remaining IPC-only files and configuration to simplify the codebase.
