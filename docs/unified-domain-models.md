# Unified 도메인 모델 참조

이 문서는 Unified Architecture에서 번역 파이프라인을 구성하는 핵심 도메인 객체를 정리합니다. `TranslatorFactory`나 파서/어플라이어를 확장할 때 각 클래스가 맡은 역할과 주요 API를 빠르게 파악할 수 있도록 실제 코드 구조를 그대로 반영했습니다.

## TranslationInput

- **경로**: [`src/react/unified/domain/translation-input.ts`](src/react/unified/domain/translation-input.ts)
- **구조**:

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

- `content`는 **단일 문자열 또는 단일 `File`**만 허용합니다. 다중 파일 업로드는 [`TranslationJobManager`](src/react/services/job-manager/TranslationJobManager.ts)가 Job 단위로 분할해 각각의 `TranslationInput`에 전달합니다.
- `options`는 파서 DTO가 그대로 주입되며, `BaseParseOptionsDto`를 상속해 정의한 커스텀 필드도 포함됩니다.
- `aiConfig`는 모델 제공자·API 키·프리셋 이름 등 번역기 설정을 묶은 객체입니다. `useTranslator` 훅이 `ConfigStore`와 사용자 입력을 조합해 생성합니다.
- `promptPresetContent`는 고급 프롬프트 프리셋 문자열로, 선택적으로 번역기에 전달됩니다.

## TranslationUnit

- **경로**: [`src/react/unified/domain/translation-unit.ts`](src/react/unified/domain/translation-unit.ts)
- **용도**: 파서가 원본 문서를 문장, 자막 라인 등 번역 가능한 최소 단위로 분할할 때 사용하는 인터페이스입니다.
- **필드**:
  - `key`: 번역된 결과를 다시 원본 위치에 매핑하기 위한 식별자.
  - `source`: 원문 텍스트.
  - `target`: 번역 결과 (초기값은 비어 있을 수 있음).

## TranslationOutput

- **경로**: [`src/react/unified/domain/translation-output.ts`](src/react/unified/domain/translation-output.ts)
- **핵심 기능**:
  - 여러 `TranslationResult`를 묶어 저장하며, `TranslationOutput.merge`로 파이프라인 단계별 결과를 손쉽게 합칠 수 있습니다.
  - `getResults`/`getResult`로 전체 또는 단일 결과를 반환합니다. 결과가 하나면 문자열이나 `Blob`을 직접 돌려주고, 여러 개인 경우 배열을 반환합니다.
  - `getAggregatedReport`는 이미지 번역처럼 단일 입력에서 다수의 산출물이 나오는 경우에도 원본 파일 단위로 성공/실패를 요약합니다.
  - `toZip`/`getSingleFile`은 다운로드 시나리오를 위해 `Blob`을 생성합니다. 단일 텍스트 결과는 자동으로 `text/plain` Blob으로 감싸집니다.

## TranslationStrategy & TranslatorEngine

- **전략 인터페이스**: [`src/react/unified/domain/translation-strategy.ts`](src/react/unified/domain/translation-strategy.ts)
- **엔진 구현**: [`src/react/unified/engine/translator-engine.ts`](src/react/unified/engine/translator-engine.ts)
- `TranslationStrategy`는 파서·번역기·어플라이어를 한 묶음으로 정의합니다. 팩토리는 `TranslationType`에 따라 적절한 조합을 생성합니다.
- `TranslatorEngine.translate`는 다음 순서를 고정된 프로그레스 콜백과 함께 실행합니다.
  1. `parser.parse(input)`
  2. `translator.translate(units, aiConfig, promptPresetContent, sourceFilePath)`
  3. `applier.apply(input, translatedUnits)`
- 파일 입력의 경우 Electron 환경에서 `File` 객체에 들어있는 `path` 속성을 추출해 번역기로 전달합니다. 로컬 파일 경로 기반 번역기가 필요할 때 활용할 수 있습니다.

## Job Manager와의 연동

- **경로**: [`src/react/services/job-manager/TranslationJobManager.ts`](src/react/services/job-manager/TranslationJobManager.ts)
- `useTranslator` 훅은 사용자가 여러 파일을 선택했을 때 각 파일을 개별 Job(`Job<File | string>`)으로 큐잉합니다. 따라서 파서와 어플라이어는 단일 파일 입력을 처리하면 되며, 동시성은 `TranslationJobManager`가 담당합니다.
- Job의 상태는 `PENDING → RUNNING → (SUCCEEDED | FAILED | CANCELLED)`로 관리되며, `concurrency` 옵션을 바꿔 동시에 처리할 파일 수를 제어할 수 있습니다.
- 모든 Job이 종료되면 `TranslationOutput.merge`로 묶은 뒤 리포트를 생성하고, 파일 번역이라면 ZIP 생성과 단일 파일 다운로드를 자동으로 시도합니다.

이 문서를 바탕으로 Unified 도메인 모델의 책임과 제약을 파악하고, 새 포맷을 도입할 때 필요한 구조적 변경을 정확하게 적용할 수 있습니다.
