# IPC → REST 전환 로드맵

## 1. Nest HTTP 앱 기본 세팅

- [x] `bootstrap.ts`에서 `NestFactory.createApplicationContext` 대신 `NestFactory.create`를 사용하도록 수정하고, `FastifyAdapter`로 HTTP 서버를 구동한다.
- [x] `ValidationPipe`를 글로벌 파이프로 등록하며, `whitelist`, `transform`, `forbidNonWhitelisted` 등 안전 옵션을 적용한다.
  ```typescript
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );
  ```
- [x] `ClassSerializerInterceptor`와 `SerializeOptions`를 전역으로 구성하여 응답 직렬화를 통제한다.
  ```typescript
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector, {
      strategy: 'excludeAll',
      exposeUnsetFields: false,
      enableImplicitConversion: true,
    })
  );
  ```
- [x] `class-transformer` 및 `class-validator` 의존성을 확인하고 필요한 경우 설치한다. (`package.json` 내 버전 유지 확인)
- [x] Swagger 모듈을 추가해 API 문서를 `/swagger` 경로에 노출하고, 앱 기동 시 `SwaggerModule.createDocument` 호출로 스키마를 생성한다.

## 2. Swagger 기반 코드젠 파이프라인 구축

- [x] `src/nest/create-swagger.ts`(임시 엔트리)에서 Nest 애플리케이션을 부트스트랩하여 Swagger JSON을 파일로 출력하도록 구현한다.
- [x] `package.json` 또는 `scripts/`에 `nest start --entryFile create-swagger.ts`를 실행하는 스크립트를 등록해 Swagger 생성 과정을 자동화한다.
- [x] React(렌더러) 측에서 Swagger JSON을 입력으로 사용하는 코드젠 스크립트를 작성하고, 생성물 위치(`src/react/api/generated` 등)를 정한다.
- [x] 코드젠 도구(OpenAPI Generator/Swagger Codegen 등)의 설정 파일을 추가해 타입 안전한 클라이언트를 생성한다.
- [x] Electron 메인 프로세스에서 Swagger JSON 기반 코드젠 클라이언트를 import해 IPC 대신 HTTP 요청을 수행하도록 준비한다.
- [x] 공통 타입 의존성은 Swagger 코드젠 산출물(`src/react/api/generated/models`)을 단일 소스로 사용하고, `src/common`, `src/types` 등 수동 정의본은 더 이상 참조하지 않는다는 원칙을 문서화한다.

## 3. 모듈별 IPC → REST 전환 루프

각 모듈은 아래 단계를 순차적으로 수행하며, 완료 시 `yarn build`와 `yarn lint`를 실행하고 커밋한다.

1. **대상 식별**

- 전환할 IPC 채널(`ipc.channel.ts`)과 핸들러(`ipc.handler.ts`)를 파악하고 연관 DTO, 서비스, 유틸을 명확히 한다.

2. **서버 전환**

- IPC 핸들러 로직을 Nest 컨트롤러 메서드로 옮기고, DTO를 `@Body`, `@Query`, `@Param` 등으로 매핑한다.
- **주의**: `@Param()`으로 숫자형 ID 등 원시 타입을 받는 경우, `ValidationPipe`의 `enableImplicitConversion` 옵션만으로는 타입 변환이 안정적으로 동작하지 않을 수 있다. DTO의 해당 필드에 `class-transformer`의 `@Type(() => Number)` 데코레이터를 명시적으로 추가하여 문자열을 숫자로 변환해야 한다.
- 컨트롤러 메소드에는 반드시 `@SerializeOptions({type: DTO})` 및 DTO 클래스 데코레이터(`@Expose`, `@Type` 등)를 활용해서 응답 타입의 직렬화 규칙을 정의한다.
- 서비스 계층 호출은 유지하되, HTTP 응답 규약(상태 코드, 직렬화)을 맞춘다.
- 모든 HTTP 응답 DTO는 `BaseResponseDto`(`src/common/dto/base-response.dto.ts`)를 상속해 `success`/`message` 필드를 일관되게 제공하고 Swagger 스키마에 노출한다. `BaseResponseType`(`src/common/ipc/dto/base-response-type.ts`)의 경우에는 ipc를 위한 것으로, swagger 연동을 위해서는 반드시 `BaseResponseDto`(`src/common/dto/base-response.dto.ts`)를 상속하도록 변경되어야 한다.
- 모든 응답타입과 요청타입은 별개의 DTO 파일로 작성되며, swagger 문서를 정확히 반영해야 한다. 이는 코드젠을 통한 타입 생성에 실제로 활용되므로, `@ApiProperty`와 같은 데코레이터의 누락은 실제 코드 작성에 치명적이다. 또한 런타임 타입 정합성을 위해 `class-validator`, `class-transformer` 데코레이터를 적절히 추가한다.
- 복잡한 nested object가 있는 경우에도, 모두 DTO 클래스로 분리하여 `@Type` 데코레이터로 명시적으로 지정하고, swagger 데코레이터 또한 각 클래스에 추가한다.
- DTO/Swagger로 정확히 모델링하기 어려운 복잡한 IPC 페이로드라서 `any` 사용을 피할 수 없거나 직렬화 규칙이 뒤엉키는 경우에는, 응답을 성격별로 분리한 REST 엔드포인트(예: 메타데이터 전용, 예제 리스트 전용)를 도입하여 구조를 단순화한다. `ExamplePreset` 전환 작업에서 `GET /example-presets/:id`와 `GET /example-presets/:id/examples`로 나누어야 했던 것처럼, `CacheTranslations` 전환에서도 목록/이력/태그 변경을 각각 `GET /cache/translations`, `GET /cache/translations/:id/history`, `PATCH /cache/translations/:id/cache-tag`로 분해해 Swagger 문서 품질과 렌더러 코드젠 타입의 신뢰도를 지켰다. 이러한 분리 전략은 IPC 단계에서 섞여 있던 책임을 명확히 하고, DTO 직렬화 규칙을 안전하게 유지하기 위한 필수 요구사항이다.
- 응답 타입을 swagger문서로 노출하기 위해서는 `@ApiOkResponse` 데코레이터를 활용한다.
- REST 전환 과정에서 DTO/타입 정의가 여전히 `src/common` 경로에 남아 있다면 즉시 제거하고, Nest는 자체 DTO 클래스/enum을, React는 Swagger 코드젠 산출물을 직접 참조하도록 리팩터링한다. 공통 경로에는 진짜 공유 로직(헬퍼 함수 등)만 유지한다.
- 필요한 경우 모듈 설정(`Module` 데코레이터)에 컨트롤러를 등록하고, 라우트 경로를 명시한다.

3. **클라이언트 교체**

- `yarn codegen`를 실행하여 최신 스키마를 반영하고, 코드젠 스크립트를 실행해 React/Electron 클라이언트를 재생성한다. 해당 과정은 다른 클라이언트측 코드 작성보다 먼저 선행되어야만 한다. 이후 클라이언트측 코드는 여기서 생성된 codegen을 수동 수정 없이 활용해야 한다.
- 기존 IPC 호출부를 새로 생성된 HTTP 클라이언트 호출로 대체하고, 오류 처리/응답 파싱을 검증한다.
- **중요**: 프론트엔드에서는 `src/types`에 수동으로 정의된 타입 대신, `src/react/api/generated/models`에 자동 생성된 타입들을 사용해야 한다. 이를 통해 백엔드 스키마 변경 시 타입 안정성을 보장한다.
- 불필요한 IPC 관련 코드를 제거한다.

4. **검증 및 QA**

- 해당 모듈의 주요 플로우를 실제 Electron 앱에서 실행하여 HTTP 통신이 정상 동작하는지 확인한다.
- `yarn build`, `yarn lint`를 실행하여 품질을 보장하고, 필요한 경우 단위 테스트를 추가/보정한다.
- QA 결과를 기록하고 다음 모듈 전환을 준비한다.

### 진행 체크리스트 (IPC 함수 기준)

#### 번역 - 이미지

- [x] `translateImage` (`src/nest/translator/image/image-translator.ipc.handler.ts`)
  - `src/react/unified/translator/image-translator.ts`에서 `ipcClient.invoke`로 호출하며, `ImageTranslatorService.translate`를 HTTP POST로 노출하면 동일한 DTO 흐름을 유지할 수 있다.

#### 설정

- [x] `getSetting` (`src/nest/settings/settings.ipc.handler.ts`)
  - 초기 렌더링과 `AppSettingsView`에서 설정 값을 읽으며, REST GET `/settings/:key` 형태로 전환 가능하다.
- [x] `updateSetting` (`src/nest/settings/settings.ipc.handler.ts`)
  - `AppSettingsView`에서 언어 설정을 저장하고 있어 REST PATCH `/settings/:key`로 자연스럽게 매핑된다.
- [x] `getAllSettings` (`src/nest/settings/settings.ipc.handler.ts`)
  - 향후 설정 화면 일괄 로드를 대비해 DTO가 준비되어 있어 REST GET `/settings`로 변환하기 적합하다.
- [x] `deleteSetting` (`src/nest/settings/settings.ipc.handler.ts`)
  - 개별 설정 삭제는 REST DELETE `/settings/:key`로 치환해도 동작 보장이 가능하다.

#### 로깅

- [x] `getLogs` (`src/nest/logger/logger.ipc.handler.ts`)
  - `useLogViewerController`에서 페이지네이션 조회를 수행하며, REST GET `/logs`로 리턴 스키마를 그대로 활용할 수 있다.
- [x] `getLogDetail` (`src/nest/logger/logger.ipc.handler.ts`)
  - 로그 상세 모달이 사용하는 함수로 REST GET `/logs/:id`로 전환하면 상세 조회가 단순화된다.
- [x] `deleteLogs` (`src/nest/logger/logger.ipc.handler.ts`)
  - 다중 선택 삭제는 REST DELETE `/logs` + 요청 본문으로 리스트를 받는 패턴으로 치환 가능하다.
- [x] `deleteAllLogs` (`src/nest/logger/logger.ipc.handler.ts`)
  - 검색 조건 기반 전체 삭제를 REST DELETE `/logs` + 쿼리/바디 파라미터로 처리할 수 있다.

#### 번역 프롬프트 프리셋

- [x] `getPromptPresets` (`src/nest/translation/prompt/prompt-preset.ipc.handler.ts`)
  - `usePromptPresetLoader`와 `PromptPresetPanel`이 목록을 사용하므로 REST GET `/prompt-presets`가 적합하다.
- [x] `getPromptPresetDetail` (`src/nest/translation/prompt/prompt-preset.ipc.handler.ts`)
  - 상세 요청은 REST GET `/prompt-presets/:id`로 직관적으로 전환된다.
- [x] `createPromptPreset` (`src/nest/translation/prompt/prompt-preset.ipc.handler.ts`)
  - 생성 플로우가 DTO를 완비하고 있어 REST POST `/prompt-presets`로 옮기기 쉽다.
- [x] `updatePromptPreset` (`src/nest/translation/prompt/prompt-preset.ipc.handler.ts`)
  - 업데이트 로직이 서비스에 위임되어 있어 REST PATCH `/prompt-presets/:id`로 자연스럽게 매핑된다.
- [x] `deletePromptPreset` (`src/nest/translation/prompt/prompt-preset.ipc.handler.ts`)
  - 삭제는 REST DELETE `/prompt-presets/:id`로 치환 가능하다.

#### 번역기

- [x] `translateTextArray` (`src/nest/translation/translator/text-translator.controller.ts`)
  - `TextArrayTranslator`가 텍스트 배열을 전달하므로 REST POST `/translator/text/translate`로 옮겨도 캐시·응답 구조가 유지된다.

#### 예제 프리셋

- [x] `getExamplePresets` (`src/nest/translation/example/example-preset.ipc.handler.ts`)
  - `ExamplePresetSelector` 및 `ExamplePresetEditor`에서 목록을 호출하므로 REST GET `/example-presets`로 매핑된다.
- [x] `getExamplePresetDetail` (`src/nest/translation/example/example-preset.ipc.handler.ts`)
  - 상세 화면에 필요한 데이터로 REST GET `/example-presets/:id`가 자연스럽다.
- [x] `loadExamplePreset` (`src/nest/translation/example/example-preset.ipc.handler.ts`)
  - 선택된 프리셋을 로드하는 작업은 REST POST `/example-presets/load`(또는 `/example-presets/:id/load`) 형태로 이관할 수 있다.
- [x] `createExamplePreset` (`src/nest/translation/example/example-preset.ipc.handler.ts`)
  - 새 프리셋 생성은 REST POST `/example-presets` 패턴으로 전환하기 용이하다.
- [x] `deleteExamplePreset` (`src/nest/translation/example/example-preset.ipc.handler.ts`)
  - 삭제는 REST DELETE `/example-presets/:id`로 구현할 수 있다.
- [x] `updateExamplePreset` (`src/nest/translation/example/example-preset.ipc.handler.ts`)
  - 수정 로직이 서비스에 캡슐화되어 있어 REST PATCH `/example-presets/:id`로 대응 가능하다.

#### 임시 작업공간

- [x] `cleanupTempWorkspace` (`src/nest/cache/temp-workspace/temp-workspace.controller.ts`)
  - `AdvancedImageViewer` 종료 시점에 REST DELETE `/temp-workspaces/:workspaceId`를 호출하며, Swagger/코드젠을 통해 렌더러는 `TempWorkspacesService.tempWorkspaceControllerDeleteTempWorkspace`를 사용해 임시 공간을 정리한다.

#### 캐시/번역 히스토리

- [x] `getTranslations` (`src/nest/cache/cache.ipc.handler.ts`)
  - `useCacheTranslations`에서 리스트를 로드하므로 REST GET `/cache/translations`로 변환이 적합하다.
- [x] `getTranslationHistory` (`src/nest/cache/cache.ipc.handler.ts`)
  - 번역 히스토리 모달이 사용하는 함수로 REST GET `/cache/translations/:id/history`로 치환 가능하다.
- [x] `updateTranslation` (`src/nest/cache/cache.ipc.handler.ts`)
  - 번역 수정 저장을 REST PATCH `/cache/translations/:id`로 매핑할 수 있다.
- [x] `updateTranslationCacheTag` (`src/nest/cache/cache.ipc.handler.ts`)
  - 캐시 태그 변경을 REST PATCH `/cache/translations/:id/cache-tag`로 노출하면 된다.
- [x] `deleteTranslation` (`src/nest/cache/cache.ipc.handler.ts`)
  - 다중 삭제가 필요하므로 REST DELETE `/cache/translations` + 요청 본문 배열 방식으로 구현할 수 있다.
- [x] `deleteAllTranslations` (`src/nest/cache/cache.ipc.handler.ts`)
  - 검색 조건 기반 전체 삭제를 REST DELETE `/cache/translations` + 쿼리/바디 파라미터로 처리 가능하다.
- [x] `exportTranslations` (`src/nest/cache/cache.ipc.handler.ts`)
  - 현재 JSON 내보내기를 REST GET `/cache/translations/export`로 대응하여 스트리밍할 수 있다.
- [x] `importTranslations` (`src/nest/cache/cache.ipc.handler.ts`)
  - 업로드 후 반영 로직을 REST POST `/cache/translations/import`로 이관할 수 있다.
- [x] `getCacheTags` (`src/nest/cache/cache.ipc.handler.ts`)
  - 캐시 태그 목록은 REST GET `/cache/tags`로 통합하면 된다.
- [x] `deleteCacheTag` (`src/nest/cache/cache.ipc.handler.ts`)
  - 삭제 + 재매핑 옵션을 REST DELETE `/cache/tags/:id`로 처리할 수 있다.

#### 공통 (Electron 창/시스템 조작)

- [x] `openZipInAdvancedViewerDialog` (`src/nest/common/common.ipc.handler.ts`)
  - REST 전환 제외: HTTP로 노출하면 외부 프로세스가 사용자 대화상자를 강제 실행할 수 있고, 호출 창 컨텍스트 식별이 어렵다.
- [x] `openExternalUrl` (`src/nest/common/common.ipc.handler.ts`)
  - REST 전환 제외: 로컬 HTTP 접근만으로도 임의 URL 실행 공격 면이 넓어져 IPC 범위 내에서 제한하는 편이 안전하다.
- [x] `openAdvancedViewer` (`src/nest/common/common.ipc.handler.ts`)
  - REST 전환 제외: 새로운 `BrowserWindow` 생명주기는 IPC 이벤트 기반으로 제어하는 편이 자연스럽고 HTTP 요청/응답과 맞지 않는다.
- [x] `advancedViewerLoadZip` (`src/nest/common/common.ipc.handler.ts`)
  - REST 전환 제외: 고급 뷰어는 `ipcClient.subscribe`로 스트림을 받으므로 해당 채널을 유지해야 하며, HTTP로 옮겨도 IPC 브로드캐스트를 제거할 수 없다.

## 4. 공통 고려 사항

- 모든 변경은 기능 동등성을 유지해야 하며, IPC 호출 경로는 완전히 제거한다.
- Swagger 문서 및 코드젠 산출물은 버전 관리를 통해 각 모듈 전환 후 일관성을 유지한다.
- Electron 앱은 로컬호스트에서만 HTTP 서버에 접근하므로, 인증/보안 설정은 내부 네트워크 전용 시나리오에 맞춰 최소화한다.
- 변경 내역은 모듈 단위로 커밋하고, PR 시 작업 범위/테스트를 상세히 기술한다.
- 전환 완료 후 잔여 IPC 관련 파일 및 설정을 정리하여 코드베이스를 단순화한다.
