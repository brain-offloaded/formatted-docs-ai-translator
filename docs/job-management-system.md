# 동시 번역을 위한 Job 관리 시스템 아키텍처

## 1. 배경

대용량 파일을 처리할 때 순차 실행만으로는 번역 시간이 길어졌습니다. 이를 해결하기 위해 프론트엔드에 경량 Job 관리 레이어를 도입하여 동시 실행, 취소, 진행 상황 추적을 지원합니다. 현재 구현은 React 컨텍스트와 훅 위에서 동작하며, 백엔드 변경 없이 렌더러에서 모든 제어를 수행합니다.

## 2. 핵심 구성 요소

### 2.1 Job 모델 (`src/react/services/job-manager/job.ts`)

-   `JobStatus` 열거형은 `PENDING`, `RUNNING`, `RETRYING`, `SUCCEEDED`, `FAILED`, `CANCELLED` 상태를 정의합니다.
-   `Job<T>` 인터페이스는 `id`, `data`, `retryCount`, `result`, `error` 필드를 포함합니다. `data`는 `File` 또는 문자열(텍스트 입력)입니다.

### 2.2 `TranslationJobManager` (`src/react/services/job-manager/TranslationJobManager.ts`)

-   **큐와 상태 관리**: 내부 `Map`과 큐 배열을 사용해 Job을 추적합니다.
-   **동시성 제어**: `options.concurrency` 개수만큼 워커를 동시에 실행합니다. 기본값은 1이며, 런타임에 `updateConfig`로 조정할 수 있습니다.
-   **이벤트**: `onProgress`, `onJobComplete`, `onAllComplete` 세 가지 이벤트를 지원합니다.
    -   `onProgress`는 전체 Job 수, 완료 수, 실패 수를 계산하여 UI 갱신에 사용됩니다.
    -   `onAllComplete`는 큐가 비었을 때 한 번만 호출되고 워커 레퍼런스를 초기화합니다.
-   **재시도 및 취소**: 기본 재시도 횟수는 0입니다. `cancel()`을 호출하면 큐를 비우고 실행 중인 Job을 모두 `CANCELLED` 상태로 전환합니다.

### 2.3 React 연동 훅

-   **`useTranslationJobManager`** (`src/react/contexts/translation/useTranslationJobManager.ts`)
    -   `TranslationProvider`에서 사용되며, `concurrencyLimit`을 기반으로 JobManager 인스턴스를 lazy 생성합니다.
    -   `cancelTranslation`, `resetJobManager` 등을 노출해 전역 컨텍스트에서 제어할 수 있도록 합니다.
-   **`TranslationContext`** (`src/react/contexts/TranslationContext.tsx`)
    -   `useTranslationJobManager`로부터 `getJobManager`, `cancelTranslation`, `resetJobManager`를 제공하고, `isTranslating`, `uiState`, `resultState` 등을 함께 관리합니다.
-   **`useTranslator` 훅** (`src/react/hooks/useTranslator.ts`)
    -   번역 버튼 클릭 시 `getJobManager()`로 JobManager를 가져와 입력을 Job 배열로 추가하고, 이벤트 리스너를 등록합니다.
    -   `onProgress`에서 진행률, 완료/실패 개수를 UI 상태에 반영합니다.
    -   `onAllComplete`에서 `TranslationOutput.merge`로 결과를 집계하고 다운로드용 Blob과 통계 리포트를 준비합니다.
    -   에러가 발생한 Job은 `FAILED`로 기록되고, 오류 메시지가 리포트에 포함됩니다.

## 3. 실행 흐름

1.  사용자가 번역을 시작하면 `useTranslator`가 기존 결과와 Job 상태를 초기화한 뒤 입력을 Job으로 큐잉합니다.
2.  `TranslationJobManager.start(worker)`가 호출되면 워커 함수가 순차적으로 Job을 소비합니다. 워커는 `TranslatorEngine`을 통해 파싱→번역→적용을 실행하고 `TranslationOutput`을 반환합니다.
3.  Job이 완료되면 상태가 `SUCCEEDED` 또는 `FAILED`로 업데이트되고, 이벤트가 발생하여 UI와 상태 스토어가 갱신됩니다.
4.  모든 Job이 끝나면 `onAllComplete`가 호출되어 ZIP 생성, 단일 파일 추출, 성공/실패 요약 텍스트가 준비됩니다.
5.  사용자가 취소 버튼을 누르면 `cancelTranslation()`이 실행되어 대기·실행 중인 Job이 모두 `CANCELLED`로 전환되고, 진행률과 `isTranslating` 상태가 즉시 업데이트됩니다.

## 4. 동시성 및 구성

-   동시성은 `TranslationProvider`에서 `useConfigStore`의 `requestsPerMinute` 값을 기반으로 1~5 사이로 설정합니다.
-   설정 변경 후 새 번역을 시작하면 `useTranslationJobManager`가 `updateConfig`를 호출하여 기존 JobManager에 즉시 반영합니다.
-   필요 시 재시도 횟수(`options.retries`)를 조정하거나, `TranslationJobManager`의 `processJob` 로직을 확장하여 백오프 전략을 추가할 수 있습니다.

## 5. 확장 팁

-   **세밀한 진행률**: 현재는 완료/실패 Job 수 기반의 전체 진행률만 표시합니다. 세부 단위 진행률이 필요하면 `ProgressCallback`을 워커에 연결해 `TranslationJobManager` 이벤트에 포함시킬 수 있습니다.
-   **결과 가중치**: 특정 Job의 가치를 다르게 두고 싶다면 `onProgress` 계산 로직 또는 `TranslationOutput.merge` 단계에서 가중치를 적용하세요.
-   **에러 처리**: `FAILED` Job의 `error` 필드는 `TranslationError` 컴포넌트 등에서 사용자에게 노출할 메시지를 구성할 때 활용할 수 있습니다.

현재 구조는 프론트엔드만으로 동시 번역, 부분 실패 리포팅, 즉시 취소를 구현하며, 새로운 번역 유형을 추가하더라도 동일한 Job 파이프라인을 재사용할 수 있습니다.
