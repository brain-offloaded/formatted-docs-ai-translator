# 프론트엔드 아키텍처

이 문서는 Formatted Docs AI Translator의 프론트엔드 구조를 요약합니다. 현재 코드는 Electron 렌더러(React) 안에서 다양한 번역 유형(텍스트, JSON, CSV, 자막, 이미지 등)을 동적으로 지원하도록 설계되어 있습니다.

## 핵심 원칙

1.  **Unified 번역 파이프라인** – 모든 번역은 `파싱(Parse) → 번역(Translate) → 적용(Apply)` 단계를 거치며, [`TranslatorEngine`](src/react/unified/engine/translator-engine.ts)이 `TranslationStrategy` 조합을 순차적으로 실행합니다.
2.  **설정 기반 UI 생성** – 번역기와 옵션 패널은 [`src/react/config/translation-configs/`](src/react/config/translation-configs/)에 정의된 설정을 기반으로 생성됩니다. 덕분에 새 유형을 추가할 때 최소한의 UI 코드만 변경하면 됩니다.
3.  **Job 관리 기반 동시 처리** – 번역 요청은 `TranslationJobManager`가 큐잉하고, `useTranslator` 훅이 상태 업데이트 및 취소를 제어합니다.

## 디렉터리 구조 개요 (`src/react`)

-   `unified/`
    -   `parser/`, `translator/`, `applier/`: 각 단계의 구현체가 위치합니다.
    -   `engine/`: `TranslatorEngine`과 관련 타입을 제공합니다.
    -   `domain/`: `TranslationInput`, `TranslationUnit`, `TranslationOutput` 등 공통 모델을 정의합니다.
-   `config/translation-configs/`
    -   번역 유형별 라벨, 입력 폼 옵션, 파서 옵션 등을 정의합니다.
-   `factories/`
    -   [`translation-strategy-factory.ts`](src/react/factories/translation-strategy-factory.ts): `TranslationType`에 따른 파서·번역기·어플라이어 조합을 제공합니다.
    -   [`TranslatorFactory.tsx`](src/react/factories/TranslatorFactory.tsx): 설정 기반 번역기 UI를 메모이제이션하여 렌더링합니다.
    -   [`ParseOptionsFactory.tsx`](src/react/factories/ParseOptionsFactory.tsx): 파서 옵션 패널을 생성합니다.
-   `views/`
    -   `TranslateView/`: 번역 메인 화면과 관련 훅이 위치합니다.
    -   `AdvancedImageViewer/`, `ImageViewerView/`: 이미지 번역 결과 뷰어.
-   `contexts/`
    -   [`TranslationContext.tsx`](src/react/contexts/TranslationContext.tsx): 전역 번역 상태와 Job 관리, Snackbar, 파일 상태 등을 제공합니다.
    -   `translation/types.ts`: `TranslationType`과 UI 상태 타입을 정의합니다.
-   `services/job-manager/`
    -   `TranslationJobManager.ts`, `job.ts`, `job-manager.types.ts`: 동시 번역을 위한 Job 관리 로직.

## Unified Core 흐름

1.  **파싱 단계**
    -   `IParser` 구현체가 입력(`string` 또는 `File[]`)을 `TranslationUnit[]`으로 변환합니다.
    -   예: `PlainTextParser`, `JsonParser`, `ImageParser`.
2.  **번역 단계**
    -   `ITranslator`가 단위를 AI 서비스로 전달합니다.
    -   `TextArrayTranslator`는 `IpcChannel.TranslateTextArray`를 호출하여 텍스트 배열을 번역합니다.
    -   `ImageTranslator`는 이미지 OCR/번역 결과를 블록 단위로 반환합니다.
3.  **적용 단계**
    -   `IApplier`가 번역된 단위를 원본 형식에 맞게 재조립합니다.
    -   결과는 `TranslationOutput`으로 반환되어 ZIP 또는 텍스트/Blob으로 활용됩니다.

## 팩토리 기반 UI 구성

-   **`TranslatorFactory`**
    -   `translation-configs`에 등록된 `translator` 옵션을 사용해 `BaseTranslator`를 구성합니다.
    -   입력 라벨, 파일 확장자, 플레이스홀더, 출력 포맷터 등을 설정할 수 있습니다.
-   **`ParseOptionsFactory`**
    -   동일 설정의 `parser.options`를 이용해 `BaseParseOptions`를 렌더링합니다.
    -   `optionItems`에 정의된 `OptionItem` 배열이 동적 폼을 구성합니다.
-   **`useTranslatorFactories`**
    -   `TranslateView`에서 현재 `TranslationType`을 기반으로 번역기/옵션 컴포넌트와 라벨을 가져옵니다.

## Job 관리와 상태 흐름

1.  `TranslationProvider`는 `useTranslationJobManager`를 통해 `TranslationJobManager` 인스턴스를 lazy 방식으로 생성합니다. 동시성은 `useConfigStore`의 `requestsPerMinute` 값을 기반으로 계산됩니다.
2.  `useTranslator` 훅은 `getJobManager()`를 호출해 파일 또는 텍스트 입력을 Job으로 큐잉하고, `onProgress`/`onAllComplete` 이벤트를 구독해 UI 상태(`UIState.translationProgress`, `completed`, `failed` 등)를 갱신합니다.
3.  Job 실행이 끝나면 `TranslationOutput.merge`로 결과를 집계하고, `TranslationContext`의 `resultState`에 ZIP·단일 파일 Blob·요약 리포트를 저장합니다.
4.  `cancelTranslation()`은 `TranslationJobManager.cancel()`을 호출해 `PENDING`/`RUNNING` Job을 일괄 `CANCELLED` 상태로 변경하고, 진행 중인 번역을 중단합니다.

## `TranslateView` 동작 요약

1.  사용자가 드롭다운에서 번역 유형을 선택하면 `TranslationContext`의 `translationType`이 업데이트됩니다.
2.  `useTranslatorFactories`가 해당 유형에 맞는 번역기·옵션 컴포넌트를 반환합니다.
3.  사용자가 번역을 실행하면 `useTranslator`가 입력을 Job 큐에 넣고, 진행률·결과 상태를 갱신합니다.
4.  모든 Job이 완료되면 `TranslationContext`가 결과를 보관하고, `ImageTranslator` 등 결과 컴포넌트가 다운로드/요약 UI를 출력합니다.

## 확장 시 참고 사항

-   새 유형을 추가할 때는 `TranslationType` enum, `translation-strategy-factory`, `translation-configs`, `TranslationTypeMapping`을 함께 확인합니다.
-   다수 파일 번역에서 Job 동작을 바꾸려면 `TranslationJobManager` 또는 `useTranslationJobManager`를 수정해 동시성·재시도 정책을 조정합니다.
-   IPC 경로가 늘어날 경우 `ipcClient` 래퍼와 Nest 측 DTO를 함께 업데이트해야 합니다.

이 구조를 기반으로 프론트엔드 기능을 확장하면, 각 번역 유형에 필요한 파이프라인과 UI를 독립적으로 관리할 수 있습니다.
