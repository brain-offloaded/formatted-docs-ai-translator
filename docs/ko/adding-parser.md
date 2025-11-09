# 새로운 파서 추가 가이드 (Unified Architecture)

## 소개

이 문서는 새로운 파일 형식을 지원하기 위해 파서(Parser)와 어플라이어(Applier)를 추가하는 절차를 안내합니다. 현재 프론트엔드는 **Unified Architecture**를 사용하며, 모든 파싱·번역·적용 로직을 Electron 렌더러(React)에서 조합합니다. 백엔드 IPC 채널은 공통 번역 API 호출(`TranslateTextArray`, `TranslateImage` 등)에만 관여하므로, 새로운 포맷을 도입할 때 대부분의 변경은 프론트엔드에 집중됩니다.

핵심 개념은 다음과 같습니다.

-   **`IParser`** – 입력을 번역 가능한 단위(`TranslationUnit[]`)로 변환합니다.
-   **`IApplier`** – 번역된 단위를 원본 구조에 다시 적용해 `TranslationOutput`을 만듭니다.
-   **`ITranslator`** – 파서가 만든 단위를 AI 번역기로 전달합니다. 텍스트 기반 형식은 `TextArrayTranslator`를 재사용하며, 특수 케이스는 전용 구현을 추가합니다.
-   **`TranslationStrategy`** – 파서·번역기·어플라이어 조합입니다. [`translationStrategyFactory`](src/react/factories/translation-strategy-factory.ts)가 생성합니다.

> ℹ️ `TranslationInput.content`는 항상 **단일 문자열 또는 단일 `File` 객체**입니다. 여러 파일을 업로드하면 [`TranslationJobManager`](src/react/services/job-manager/TranslationJobManager.ts)가 파일마다 별도 Job을 만들고 파서에는 한 번에 하나씩 전달합니다. 따라서 새로운 파서에서도 `File[]`을 직접 다룰 필요가 없습니다.

## 1단계: 파서 옵션 DTO 정의 (선택 사항)

특정 파서에 맞춤 옵션이 필요하다면 DTO를 정의합니다.

1.  **경로** – [`src/react/unified/domain/options/`](src/react/unified/domain/options/)
2.  **파일** – `new-format-parser-options.dto.ts`
3.  **구현** – `BaseParseOptionsDto`를 상속하여 필요한 필드를 선언합니다.

```typescript
import { BaseParseOptionsDto } from './base-parse-options.dto';

export class NewFormatParserOptionsDto extends BaseParseOptionsDto {
  // 예: 구분자, 전처리 옵션 등
  // customDelimiter?: string;
}
```

옵션이 필요 없다면 이 단계를 생략하고 `BaseParseOptionsDto`를 그대로 사용해도 됩니다.

## 2단계: 파서(`IParser`) 구현

1.  **경로** – [`src/react/unified/parser/`](src/react/unified/parser/)
2.  **파일** – `new-format-parser.ts`
3.  **구현** – `IParser` 인터페이스를 만족하도록 `parse` 메서드를 작성합니다. `TranslationInput.content`는 문자열 또는 단일 `File`이므로, 필요하다면 헬퍼 메서드를 통해 `.text()`로 원문을 추출하세요.

```typescript
import { IParser } from './i-parser';
import { TranslationInput } from '../domain/translation-input';
import { TranslationUnit } from '../domain/translation-unit';
import { NewFormatParserOptionsDto } from '../domain/options/new-format-parser-options.dto';

export class NewFormatParser
  implements IParser<TranslationInput<NewFormatParserOptionsDto>, TranslationUnit[]>
{
  async parse(input: TranslationInput<NewFormatParserOptionsDto>): Promise<TranslationUnit[]> {
    const raw = await this.extractText(input.content);
    const options = input.options;

    const units: TranslationUnit[] = [];
    raw.split('\n').forEach((line, index) => {
      const key = `line_${index}`;
      units.push({ key, source: line, target: '' });
    });

    return units;
  }

  private async extractText(content: string | File): Promise<string> {
    if (typeof content === 'string') {
      return content;
    }

    return content.text();
  }
}
```

## 3단계: 어플라이어(`IApplier`) 구현

1.  **경로** – [`src/react/unified/applier/`](src/react/unified/applier/)
2.  **파일** – `new-format-applier.ts`
3.  **구현** – `apply` 메서드에서 번역된 텍스트를 원본 구조에 맞게 합성합니다. 입력이 파일인 경우에도 단일 `File`로 전달되므로 파일 이름은 `content.name`으로 접근하면 됩니다.

```typescript
import { IApplier } from './i-applier';
import { TranslationInput } from '../domain/translation-input';
import { TranslationUnit } from '../domain/translation-unit';
import { TranslationOutput } from '../domain/translation-output';
import { NewFormatParserOptionsDto } from '../domain/options/new-format-parser-options.dto';

export class NewFormatApplier
  implements IApplier<TranslationInput<NewFormatParserOptionsDto>, TranslationUnit[], TranslationOutput>
{
  async apply(
    originalInput: TranslationInput<NewFormatParserOptionsDto>,
    translatedTexts: TranslationUnit[]
  ): Promise<TranslationOutput> {
    const original = await this.readOriginal(originalInput.content);
    const map = new Map(translatedTexts.map((unit) => [unit.key, unit.target]));

    const rebuilt = original
      .split('\n')
      .map((line, index) => {
        const key = `line_${index}`;
        return map.get(key) ?? line;
      })
      .join('\n');

    const fileName =
      typeof originalInput.content === 'string'
        ? 'translated.new-format'
        : `${originalInput.content.name}.out`;

    return new TranslationOutput([
      {
        name: fileName,
        success: true,
        result: rebuilt,
      },
    ]);
  }

  private async readOriginal(content: string | File): Promise<string> {
    if (typeof content === 'string') {
      return content;
    }

    return content.text();
  }
}
```

## 4단계: 번역 전략에 등록

`TranslationType`과 전략 팩토리를 업데이트하여 새 조합을 사용할 수 있도록 합니다.

1.  **열거형 추가** – `src/react/contexts/translation/types.ts`

    ```typescript
    export enum TranslationType {
      // ... 기존 타입
      NewFormat = 'new-format',
    }
    ```

    라벨이 필요하면 `src/react/constants/TranslationTypeMapping.ts`의 `getTranslationTypeLabel`에 항목을 추가합니다.

2.  **전략 등록** – `src/react/factories/translation-strategy-factory.ts`

    ```typescript
    import { NewFormatParser } from '../unified/parser/new-format-parser';
    import { NewFormatApplier } from '../unified/applier/new-format-applier';
    import { TextArrayTranslator } from '../unified/translator/text-array-translator';

    // ...

    case TranslationType.NewFormat:
      return {
        parser: new NewFormatParser(),
        translator: new TextArrayTranslator(),
        applier: new NewFormatApplier(),
      };
    ```

## 5단계: UI 설정 반영

`TranslatorFactory`와 `ParseOptionsFactory`는 [`src/react/config/translation-configs/`](src/react/config/translation-configs/)의 정의를 기반으로 UI를 렌더링합니다. 새 형식을 사용자에게 노출하려면 다음을 수행하세요.

1.  **설정 파일 작성** – `src/react/config/translation-configs/new-format.config.ts`

    ```typescript
    import { TranslationConfigDefinition } from '@/react/types/translation-config-types';
    import { TranslationType } from '@/react/contexts/TranslationContext';
    import { NewFormatParserOptionsDto } from '@/react/unified/domain/options/new-format-parser-options.dto';

    export const newFormatConfig: TranslationConfigDefinition<NewFormatParserOptionsDto> = {
      type: TranslationType.NewFormat,
      label: 'New Format 번역',
      translator: {
        inputLabel: '입력:',
        inputPlaceholder: '번역할 콘텐츠를 붙여넣거나 파일을 업로드하세요.',
        fileExtension: '.nf',
        fileLabel: 'New Format 파일',
        ipc: { parse: null, apply: null },
      },
      parser: {
        options: {
          label: 'New Format 파싱 옵션',
          optionItems: [],
        },
        dto: NewFormatParserOptionsDto,
      },
    };
    ```

2.  **인덱스에 포함** – `src/react/config/translation-configs/index.ts`에 `newFormatConfig`를 추가합니다.

설정을 추가하면 `TranslateView`의 드롭다운·입력 폼·옵션 패널이 자동으로 갱신됩니다.

## 6단계: 테스트 체크리스트

-   `yarn dev`(단일 번들 실행) 또는 빠른 반복이 필요하면 `yarn dev:watch` 환경에서 새 번역 유형을 선택해 입력/옵션 UI가 정상적으로 표시되는지 확인합니다.
-   `useTranslator`를 통해 번역을 실행하고, 결과 ZIP/텍스트가 기대한 구조로 생성되는지 검증합니다.
-   파일 입력을 사용하는 경우 `BaseTranslator`가 `parserOptions.isFile`을 true로 받는지 확인합니다.

이상의 단계를 완료하면 새 포맷이 Unified Architecture 파이프라인에 완전히 통합됩니다.
