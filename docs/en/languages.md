# Language Metadata Guide

## Overview

- Languages used by the translation pipeline are defined only in `src/common/language.ts`.
- The same enum set is shared between Nest and React, so additions and edits happen in one place.
- Metadata (`languageMetadata`) keeps only multilingual labels and UI visibility (`supportsUI`).

## Main Types and Constants

| Name | Description |
| --- | --- |
| `Language` | Full language enum recognized by the app, including `Language.ANY` |
| `SourceLanguage` | Enum used for source language selection, including `ANY` |
| `TargetLanguage` | Enum used for translation target selection |
| `languageMetadata` | Per-language metadata array with labels and `supportsUI` |
| `sourceLanguages` / `targetLanguages` | Enum-based language lists |
| `uiLanguages` | Languages available in the UI (`supportsUI === true`) |
| `getLanguageLabel`, `getLanguageLabelByCode` | Convert IDs or code strings such as `ko` and `en` into labels |

## Adding a Language

1. Add a new entry to the `Language` enum.
2. Add the matching label and `supportsUI` value to `LANGUAGE_DEFINITIONS`.
3. If needed, add string detection helpers such as `isSpanish` and connect them through `isLanguage`.
4. Check whether presets, caches, or other domain logic depend on the language set.

## The Role of `ANY`

- `Language.ANY` is used for detection mode or inputs that are not fixed to a single language.
- It is not included in target translation language lists and is excluded from preset persistence.
- In the UI it is presented as “Any Language / 모든 언어”.

## Presets and Metadata

- Example presets create an n×n matrix from `targetLanguages`.
- When a language is added, updating metadata is enough for both UI and backend loops to expand automatically.
- Prompt and settings screens combine `getLanguageLabel` and `uiLanguages` for display.

## Cautions

- Metadata array order becomes the default order in dropdowns.
- When adding labels for a new language, update i18n resources under `src/react/locales/*.json` as well.
