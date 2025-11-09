# 이미지 번역 기능 추가 가이드 (Unified Architecture)

이 문서는 Unified Architecture 위에서 이미지 번역 유형이 동작하는 방식을 설명하고, 관련 코드를 확장할 때 확인해야 할 지점을 정리합니다.

## 1. 데이터 흐름 개요

이미지 번역은 일반 텍스트 번역과 동일하게 **파싱 → 번역 → 적용** 단계로 구성되지만, OCR·후처리 과정이 포함되어 여러 번역 단위(`TranslationUnit`)를 다룹니다.

1.  **입력 수집** – 사용자가 `ImageTranslator` 컴포넌트에서 이미지를 업로드하면 `BaseTranslator`가 파일 기반 입력으로 파서 옵션을 구성합니다.
2.  **파싱 (`ImageParser`)** – [`src/react/unified/parser/image-parser.ts`](src/react/unified/parser/image-parser.ts)에서 파일을 Base64 문자열과 파일명으로 변환해 단일 `TranslationUnit`을 생성합니다. 이 단계에서는 OCR을 수행하지 않습니다.
3.  **전송/번역 (`ImageTranslator`)** – [`src/react/unified/translator/image-translator.ts`](src/react/unified/translator/image-translator.ts)가 단일 유닛을 받아 `IpcChannel.TranslateImage`로 전송합니다.
    - `ipcClient.invoke`를 통해 Nest 백엔드에 이미지를 전달합니다.
    - 백엔드에서 OCR 및 번역을 수행한 뒤 OCR 블록과 번역 블록을 돌려주면, 각 블록을 별도 `TranslationUnit`으로 재구성합니다. `key`에는 `파일명|bounding box|원본 base64` 형태가 저장됩니다.
4.  **적용 (`ImageApplier`)** – [`src/react/unified/applier/image-applier.ts`](src/react/unified/applier/image-applier.ts)는 블록 단위 결과를 받아 번역 텍스트를 이미지에 오버레이하고, 원본/번역본/중간 JSON을 모두 포함한 `TranslationOutput`을 반환합니다.
5.  **집계 및 노출** – `useTranslator` 훅이 여러 파일의 출력을 병합하고 요약 정보를 생성합니다. 사용자는 `ImageTranslator` 내부에서 통계 카드·ZIP 다운로드 버튼·고급 뷰어 진입 버튼을 확인할 수 있습니다.

## 2. 핵심 코드 위치

### 2.1 `translationStrategyFactory`

이미지 번역 전략은 `src/react/factories/translation-strategy-factory.ts`에 정의되어 있습니다.

```typescript
case TranslationType.Image:
  return {
    parser: new ImageParser(),
    translator: new ImageTranslator(),
    applier: new ImageApplier(),
  };
```

다른 이미지 파이프라인을 추가하려면 새로운 파서/번역기/어플라이어를 구현하고 `TranslationType`에 맞춰 위 분기를 수정합니다.

### 2.2 파서 (`ImageParser`)

```typescript
export class ImageParser
  implements IParser<TranslationInput<BaseParseOptionsDto>, TranslationUnit[]>
{
  async parse(input: TranslationInput<BaseParseOptionsDto>): Promise<TranslationUnit[]> {
    const { base64, name } = await extractImageAsBase64(input);
    if (!base64) return [];

    return [
      {
        key: name,
        source: base64,
        target: '',
      },
    ];
  }
}
```

### 2.3 번역기 (`ImageTranslator`)

```typescript
const payload: TranslateImageRequestDto = {
  requestId: crypto.randomUUID(),
  aiSettings: config,
  promptPresetContent: promptPresetContent || '',
  sourceFilePath: sourceFilePath || '',
  base64: unit.source,
  cacheTag: config.cacheTag?.trim() ? config.cacheTag.trim() : DEFAULT_CACHE_TAG,
};

const response = (await ipcClient.invoke(
  IpcChannel.TranslateImage,
  payload
)) as TranslateImageResponseDto;

const blockUnits = translated.map((block, index) => ({
  key: `${fileName}|${JSON.stringify(block.box_2d)}|${base64}`,
  source: ocr[index]?.text ?? '',
  target: block.text ?? '',
}));
```

각 블록은 OCR 텍스트와 번역 텍스트를 모두 포함합니다. `ImageApplier`가 이후 오버레이 작업을 수행할 수 있도록 bounding box와 원본 이미지가 `key`에 함께 담겨 있습니다.

### 2.4 어플라이어 (`ImageApplier`)

-   블록 유닛을 순회하며 `applyTextToImage`로 번역 결과를 합성합니다.
-   `applied/`, `original/`, `json/` 디렉터리 구조를 갖는 `TranslationOutput`을 생성하여 ZIP으로 묶을 준비를 합니다.
-   입력이 비어 있는 경우(예: 번역 결과가 비어 있음)에도 원본 이미지와 빈 JSON을 반환해 UI가 정상적으로 동작하도록 합니다.

## 3. 프론트엔드 UI 구성

-   **번역기 컴포넌트** – [`src/react/components/translators/ImageTranslator.tsx`](src/react/components/translators/ImageTranslator.tsx)는 `BaseTranslator`를 확장해 프롬프트 프리셋, 파일 업로드, 결과 패널을 관리합니다.
-   **프롬프트 프리셋** – `PromptPresetType.IMAGE`를 사용하며, `usePromptPresetLoader`는 `TranslationType.Image`일 때 이미지 전용 프리셋만 불러옵니다.
-   **고급 이미지 뷰어** – `useAdvancedImageViewer` 훅을 통해 `AdvancedImageViewer` 창을 띄워 ZIP을 전달합니다. 사용자는 합성된 이미지와 OCR/번역 정보를 시각적으로 확인할 수 있습니다.

## 4. 결과 집계 및 다운로드 흐름

1.  `useTranslator` 훅이 `TranslationJobManager`에 파일 단위 작업을 추가합니다.
2.  모든 작업이 완료되면 `TranslationOutput.merge`로 통합하고, 보고서·ZIP·단일 파일 Blob을 `TranslationContext` 상태에 저장합니다.
3.  `ImageTranslator`는 성공률과 파일별 결과를 카드 형태로 보여 주며, 성공한 파일이 있을 때만 ZIP 다운로드와 고급 뷰어 버튼을 활성화합니다.

## 5. 확장 시 체크리스트

-   **새 IPC 경로가 필요한가?** – 기본 `TranslateImage` 채널로 충분한지, 아니면 백엔드 DTO를 확장해야 하는지 확인합니다.
-   **`TranslationOutput` 구조** – 추가 산출물이 있다면 `ImageApplier`에서 반환하는 파일 목록에 반영해야 합니다.
-   **프롬프트 타입** – 이미지 전용 프롬프트 외에 추가 타입이 필요하면 `PromptPresetType`과 관련 스토어(`useConfigStore`)를 업데이트합니다.

위 흐름을 이해하면 이미지 번역 파이프라인을 안정적으로 확장하거나, 다른 시각 자료 번역 유형을 도입할 수 있습니다.
