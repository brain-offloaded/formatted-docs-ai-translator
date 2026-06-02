# Adding a New Parser (Unified Architecture)

## Introduction

This guide explains how to add support for a new file format by implementing a parser and an applier. The current frontend uses a **Unified Architecture** in which parsing, translation, and apply logic are composed in the Electron renderer (React). Backend IPC channels are only used for shared translation requests such as `TranslateTextArray` and `TranslateImage`, so most changes for a new format happen in the frontend.

Core concepts:

- **`IParser`**: converts input into `TranslationUnit[]`
- **`IApplier`**: applies translated units back into the original structure and produces `TranslationOutput`
- **`ITranslator`**: sends parser output to the AI translator. Text-based formats usually reuse `TextArrayTranslator`; special cases can add a custom implementation.
- **`TranslationStrategy`**: the parser/translator/applier combination built by [`translationStrategyFactory`](src/react/factories/translation-strategy-factory.ts)

> `TranslationInput.content` is always a single string or a single `File`. When users upload multiple files, [`TranslationJobManager`](src/react/services/job-manager/TranslationJobManager.ts) creates one job per file. New parsers do not need to handle `File[]` directly.

## Step 1: Define a parser options DTO (optional)

If the new parser needs custom options, define a DTO:

1. **Directory**: [`src/react/unified/domain/options/`](src/react/unified/domain/options/)
2. **File**: `new-format-parser-options.dto.ts`
3. **Implementation**: extend `BaseParseOptionsDto`

```ts
import { BaseParseOptionsDto } from './base-parse-options.dto';

export class NewFormatParserOptionsDto extends BaseParseOptionsDto {
  // Example custom options
  // customDelimiter?: string;
}
```

If no custom options are needed, reusing `BaseParseOptionsDto` is fine.

## Step 2: Implement the parser (`IParser`)

1. **Directory**: [`src/react/unified/parser/`](src/react/unified/parser/)
2. **File**: `new-format-parser.ts`
3. **Implementation**: provide `parse` and extract text from a string or single `File`

```ts
import { IParser } from './i-parser';
import { TranslationInput } from '../domain/translation-input';
import { TranslationUnit } from '../domain/translation-unit';
import { NewFormatParserOptionsDto } from '../domain/options/new-format-parser-options.dto';

export class NewFormatParser
  implements IParser<TranslationInput<NewFormatParserOptionsDto>, TranslationUnit[]>
{
  async parse(input: TranslationInput<NewFormatParserOptionsDto>): Promise<TranslationUnit[]> {
    const raw = await this.extractText(input.content);
    const units: TranslationUnit[] = [];

    raw.split('\n').forEach((line, index) => {
      units.push({
        key: `line_${index}`,
        source: line,
        target: '',
      });
    });

    return units;
  }

  private async extractText(content: string | File): Promise<string> {
    if (typeof content === 'string') return content;
    return content.text();
  }
}
```

## Step 3: Implement the applier (`IApplier`)

1. **Directory**: [`src/react/unified/applier/`](src/react/unified/applier/)
2. **File**: `new-format-applier.ts`
3. **Implementation**: rebuild the translated structure and return `TranslationOutput`

```ts
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
      .map((line, index) => map.get(`line_${index}`) ?? line)
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
    if (typeof content === 'string') return content;
    return content.text();
  }
}
```

## Step 4: Register the translation strategy

Update `TranslationType` and the strategy factory so the new combination can be used.

1. **Add enum entry** in `src/react/contexts/translation/types.ts`
2. **Add label** in `src/react/constants/TranslationTypeMapping.ts` if needed
3. **Register the strategy** in `src/react/factories/translation-strategy-factory.ts`

```ts
import { NewFormatParser } from '../unified/parser/new-format-parser';
import { NewFormatApplier } from '../unified/applier/new-format-applier';
import { TextArrayTranslator } from '../unified/translator/text-array-translator';

case TranslationType.NewFormat:
  return {
    parser: new NewFormatParser(),
    translator: new TextArrayTranslator(),
    applier: new NewFormatApplier(),
  };
```

## Step 5: Wire it into the UI

The frontend UI is rendered from definitions under [`src/react/config/translation-configs/`](src/react/config/translation-configs/). Add a config file for the new format.

```ts
import { TranslationConfigDefinition } from '@/react/types/translation-config-types';
import { TranslationType } from '@/react/contexts/TranslationContext';
import { NewFormatParserOptionsDto } from '@/react/unified/domain/options/new-format-parser-options.dto';

export const newFormatConfig: TranslationConfigDefinition<NewFormatParserOptionsDto> = {
  type: TranslationType.NewFormat,
  label: 'New Format Translation',
  translator: {
    inputLabel: 'Input:',
    inputPlaceholder: 'Paste content or upload a file.',
    fileExtension: '.nf',
    fileLabel: 'New Format File',
    ipc: { parse: null, apply: null },
  },
  parser: {
    options: {
      label: 'New Format Parser Options',
      optionItems: [],
    },
    dto: NewFormatParserOptionsDto,
  },
};
```

Then export it from `src/react/config/translation-configs/index.ts`.

## Step 6: Test Checklist

- Run the new translation type in `yarn dev` or `yarn dev:watch` and confirm that the input and options UI render correctly.
- Execute translation through `useTranslator` and verify that ZIP or text output matches the expected structure.
- For file input, confirm that `BaseTranslator` passes `parserOptions.isFile = true`.

After these steps, the new format is fully integrated into the Unified Architecture pipeline.
