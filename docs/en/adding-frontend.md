# Frontend Integration Guide (Unified Architecture)

This document explains how to integrate a new translation type into the frontend after implementing the required `IParser` and `IApplier` described in [`adding-parser.md`](./adding-parser.md).

## Prerequisites

- The parser and applier for the new type already exist under `src/react/unified/parser/` and `src/react/unified/applier/`.
- If needed, a custom `ITranslator` exists under `src/react/unified/translator/`. Most text-based formats reuse `TextArrayTranslator`.

## Key Components

The frontend uses a **factory-based architecture** to inject type-specific UI and logic.

- **`translationStrategyFactory`** (`src/react/factories/translation-strategy-factory.ts`)
  - builds the `parser`, `translator`, and `applier` combination for a `TranslationType`
  - is injected into [`TranslatorEngine`](src/react/unified/engine/translator-engine.ts)
- **`TranslatorFactory`** (`src/react/factories/TranslatorFactory.tsx`)
  - renders the translator UI from definitions in [`src/react/config/translation-configs/`](src/react/config/translation-configs/)
- **`ParseOptionsFactory`** (`src/react/factories/ParseOptionsFactory.tsx`)
  - builds the parser options panel from the same config definitions

## Integration Steps

### 1. Extend `TranslationType`

Add the new type to `src/react/contexts/translation/types.ts`.

```ts
export enum TranslationType {
  Text = 'text',
  Json = 'json',
  Csv = 'csv',
  Subtitle = 'subtitle',
  Image = 'image',
  Yaml = 'yaml',
}
```

If needed, update `src/react/constants/TranslationTypeMapping.ts` so the dropdown label is correct.

### 2. Register the combination in `translationStrategyFactory`

Add the imports and the `switch` branch in `src/react/factories/translation-strategy-factory.ts`.

```ts
import { YamlParser } from '../unified/parser/yaml-parser';
import { YamlApplier } from '../unified/applier/yaml-applier';
import { TextArrayTranslator } from '../unified/translator/text-array-translator';

case TranslationType.Yaml:
  return {
    parser: new YamlParser(),
    translator: new TextArrayTranslator(),
    applier: new YamlApplier(),
  };
```

Formats like image translation may need a specialized translator such as `ImageTranslator`.

### 3. Define the translation UI config

Create a config file under `src/react/config/translation-configs/`.

```ts
import { TranslationConfigDefinition } from '@/react/types/translation-config-types';
import { TranslationType } from '@/react/contexts/TranslationContext';
import { OptionType } from '@/react/components/options/DynamicOptions';
import { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';

export const yamlConfig: TranslationConfigDefinition<BaseParseOptionsDto> = {
  type: TranslationType.Yaml,
  label: 'YAML Translation',
  translator: {
    inputLabel: 'YAML Input:',
    inputPlaceholder: 'Paste YAML content or attach a file.',
    fileExtension: '.yaml,.yml',
    fileLabel: 'YAML File',
    ipc: {
      parse: null,
      apply: null,
    },
  },
  parser: {
    options: {
      label: 'YAML Parser Options',
      optionItems: [
        {
          key: 'preserveComments',
          label: 'Preserve comments',
          type: OptionType.BOOLEAN,
          description: 'Keep comments after translation.',
        },
      ],
    },
  },
};
```

- The `translator` block controls labels, placeholders, and file picker UI.
- `parser.options.optionItems` defines extra UI fields using the `OptionItem` contract from `DynamicOptions`.

### 4. Export the config from the index

Register the config in `src/react/config/translation-configs/index.ts`.

```ts
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

### 5. Verify integration with existing UI

- Check that `TranslatorFactory.getConfig` and `ParseOptionsFactory.getConfig` build the expected translator and options panel.
- For file-based types, confirm that `BaseTranslator` passes `isFile: true` in parser options.
- If the new type needs advanced prompt presets, update `PromptPresetType` and related hooks such as `usePromptPresetLoader`.

## Wrap-up

After these steps, the new translation type appears in the `TranslateView` dropdown and reuses the same parse -> translate -> apply pipeline through `TranslatorEngine`. Special cases can still add their own UI layers on top, similar to image translation.
