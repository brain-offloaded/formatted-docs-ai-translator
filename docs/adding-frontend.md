# 프론트엔드 연동 가이드 (Unified Architecture)

이 문서는 [`docs/adding-parser.md`](docs/adding-parser.md)를 따라 새로운 번역 유형에 필요한 `IParser`와 `IApplier`를 구현한 뒤, 해당 번역 유형을 프론트엔드에 통합하는 방법을 설명합니다.

## 전제 조건

-   새 번역 유형을 위한 파서와 어플라이어가 `src/react/unified/parser/` 및 `src/react/unified/applier/`에 구현되어 있습니다.
-   필요하다면 `src/react/unified/translator/` 아래에 맞춤 `ITranslator`가 준비되어 있습니다. 대부분의 텍스트 기반 형식은 기존 `TextArrayTranslator`를 재사용합니다.

## 핵심 구성 요소 정리

프론트엔드는 **팩토리 기반 아키텍처**로 번역 유형별 UI와 로직을 주입합니다.

-   **`translationStrategyFactory`** (`src/react/factories/translation-strategy-factory.ts`)
    -   `TranslationType`에 맞는 `parser`, `translator`, `applier` 조합을 생성합니다.
    -   [`TranslatorEngine`](src/react/unified/engine/translator-engine.ts)에 주입되어 실제 번역 파이프라인을 구성합니다.
-   **`TranslatorFactory`** (`src/react/factories/TranslatorFactory.tsx`)
    -   [`src/react/config/translation-configs/`](src/react/config/translation-configs/)에 정의된 설정을 기반으로 번역기 UI를 렌더링합니다.
-   **`ParseOptionsFactory`** (`src/react/factories/ParseOptionsFactory.tsx`)
    -   동일한 설정을 사용해 파서 옵션 패널을 구성합니다.

## 단계별 연동 절차

### 1. `TranslationType` 열거형 확장

새로운 유형을 `src/react/contexts/translation/types.ts`의 `TranslationType` enum에 추가합니다.

```typescript
export enum TranslationType {
  Text = 'text',
  Json = 'json',
  Csv = 'csv',
  Subtitle = 'subtitle',
  Image = 'image',
  Yaml = 'yaml', // 예시: YAML 번역 유형 추가
}
```

필요하다면 `src/react/constants/TranslationTypeMapping.ts`의 `getTranslationTypeLabel`/`getTranslationTypes`에 라벨을 추가해 드롭다운 표기를 맞춥니다.

### 2. `translationStrategyFactory`에 조합 등록

`src/react/factories/translation-strategy-factory.ts`에서 새 유형에 대한 `switch` 분기와 필요한 import를 추가합니다.

```typescript
import { YamlParser } from '../unified/parser/yaml-parser';
import { YamlApplier } from '../unified/applier/yaml-applier';
import { TextArrayTranslator } from '../unified/translator/text-array-translator';

// ...

case TranslationType.Yaml:
  return {
    parser: new YamlParser(),
    translator: new TextArrayTranslator(),
    applier: new YamlApplier(),
  };
```

> `translator`는 형식에 따라 다른 구현이 필요할 수 있습니다. 이미지처럼 특수한 유형은 `ImageTranslator`처럼 별도 클래스를 사용합니다.

### 3. 번역 UI 설정 정의

UI와 파서 옵션은 `src/react/config/translation-configs/`에 있는 설정 객체로 제어합니다. 새 파일을 만들어 기본 정보를 정의합니다.

```typescript
// src/react/config/translation-configs/yaml.config.ts
import { TranslationConfigDefinition } from '@/react/types/translation-config-types';
import { TranslationType } from '@/react/contexts/TranslationContext';
import { OptionType } from '@/react/components/options/DynamicOptions';
import { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';

export const yamlConfig: TranslationConfigDefinition<BaseParseOptionsDto> = {
  type: TranslationType.Yaml,
  label: 'YAML 번역',
  translator: {
    inputLabel: 'YAML 입력:',
    inputPlaceholder: '번역할 YAML 콘텐츠를 붙여넣거나 파일을 첨부하세요.',
    fileExtension: '.yaml,.yml',
    fileLabel: 'YAML 파일',
    ipc: {
      parse: null,
      apply: null,
    },
  },
  parser: {
    options: {
      label: 'YAML 파싱 옵션',
      optionItems: [
        {
          key: 'preserveComments',
          label: '주석 유지',
          type: OptionType.BOOLEAN,
          description: '번역 후에도 주석을 유지합니다.',
        },
      ],
    },
  },
};
```

-   `translator` 블록은 번역기 헤더에 표시되는 라벨, 플레이스홀더, 파일 선택 UI를 구성합니다.
-   `parser.options.optionItems`는 [`DynamicOptions`](src/react/components/options/DynamicOptions.tsx)의 `OptionItem` 형식을 이용해 추가 입력 필드를 정의합니다. 값은 자동으로 파서 옵션 DTO에 합쳐집니다.

### 4. 설정 인덱스에 포함

`src/react/config/translation-configs/index.ts`에 새 설정을 추가하여 팩토리가 인식하도록 합니다.

```typescript
import { yamlConfig } from './yaml.config';

export const translationConfigs = [
  jsonConfig,
  csvConfig,
  textConfig,
  subtitleConfig,
  imageConfig,
  yamlConfig,
];
```

### 5. (선택) 기존 UI 컴포넌트와의 통합 확인

-   `TranslatorFactory.getConfig`와 `ParseOptionsFactory.getConfig`를 통해 번역기/옵션 패널이 정상적으로 생성되는지 확인합니다.
-   파일 업로드가 필요한 유형이라면 `parserOptions`에 `isFile: true`가 전달되는지 (`BaseTranslator` 내부) 검토합니다.
-   고급 프롬프트 프리셋이 필요하면 `PromptPresetType`에 새 유형을 추가하고 관련 훅(`usePromptPresetLoader`)을 업데이트합니다.

## 마무리

위 단계를 완료하면 새 번역 유형이 `TranslateView`의 드롭다운에 노출되고, `TranslatorEngine`을 통해 파싱→번역→적용 파이프라인을 그대로 사용할 수 있습니다. 필요한 경우 [`docs/adding-image-translation.md`](docs/adding-image-translation.md)처럼 특수 유형에 맞춘 추가 UI를 구성해 주세요.
