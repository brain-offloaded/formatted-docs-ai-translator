# Image Translation Extension Guide (Unified Architecture)

This document explains how image translation works on top of the Unified Architecture and highlights the places to inspect when extending the related code.

## 1. Data Flow Overview

Image translation still follows **Parse -> Translate -> Apply**, but it includes OCR and post-processing, so it works with multiple `TranslationUnit` values.

1. **Input collection**: when a user uploads images in the `ImageTranslator` component, `BaseTranslator` configures file-based parser options.
2. **Parsing (`ImageParser`)**: [`src/react/unified/parser/image-parser.ts`](src/react/unified/parser/image-parser.ts) converts the file into a Base64 string and file name, then produces a single `TranslationUnit`. OCR does not happen here.
3. **Translate (`ImageTranslator`)**: [`src/react/unified/translator/image-translator.ts`](src/react/unified/translator/image-translator.ts) sends that unit to `IpcChannel.TranslateImage`.
   - it calls the Nest backend through `ipcClient.invoke`
   - once the backend returns OCR and translated blocks, the translator rebuilds them as separate `TranslationUnit` items
4. **Apply (`ImageApplier`)**: [`src/react/unified/applier/image-applier.ts`](src/react/unified/applier/image-applier.ts) overlays translated text on the image and returns a `TranslationOutput` that includes originals, translated images, and intermediate JSON
5. **Aggregate and render**: the `useTranslator` hook merges output from multiple files and generates summary data. The UI then exposes statistics cards, ZIP download, and entry points into the advanced viewer.

## 2. Core Code Locations

### 2.1 `translationStrategyFactory`

The image translation strategy lives in `src/react/factories/translation-strategy-factory.ts`.

```ts
case TranslationType.Image:
  return {
    parser: new ImageParser(),
    translator: new ImageTranslator(),
    applier: new ImageApplier(),
  };
```

If you introduce another visual translation pipeline, add new parser/translator/applier implementations and route them from `TranslationType`.

### 2.2 Parser (`ImageParser`)

```ts
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

### 2.3 Translator (`ImageTranslator`)

```ts
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

Each block carries both OCR text and translated text. The `key` also keeps the bounding box and original image reference so `ImageApplier` can perform the overlay step later.

### 2.4 Applier (`ImageApplier`)

- iterates through block units and applies overlays through `applyTextToImage`
- prepares a `TranslationOutput` with `applied/`, `original/`, and `json/` paths for ZIP packaging
- still returns original images and empty JSON structures when translated output is empty so that the UI remains stable

## 3. Frontend UI Composition

- **Translator component**: [`src/react/components/translators/ImageTranslator.tsx`](src/react/components/translators/ImageTranslator.tsx) extends `BaseTranslator` and handles prompt presets, file upload, and result panels.
- **Prompt presets**: uses `PromptPresetType.IMAGE`; `usePromptPresetLoader` loads image-specific presets when `TranslationType.Image` is selected.
- **Advanced image viewer**: the `useAdvancedImageViewer` hook opens `AdvancedImageViewer` and passes the ZIP for visual inspection of composites, OCR blocks, and translated blocks.

## 4. Result Aggregation and Download Flow

1. `useTranslator` adds file-level jobs to `TranslationJobManager`.
2. After completion, `TranslationOutput.merge` combines them and stores report text, ZIP output, and single-file blobs in `TranslationContext`.
3. `ImageTranslator` shows summary cards and only enables ZIP download or advanced viewer actions when at least one file succeeded.

## 5. Extension Checklist

- **Need a new IPC route?** Check whether `TranslateImage` is enough or whether Nest DTOs must be extended.
- **Need more output artifacts?** Update the file list returned by `ImageApplier`.
- **Need more prompt types?** Extend `PromptPresetType` and related config stores.

Understanding this flow makes it much easier to extend the image translation pipeline safely or to add other visual translation types later.
