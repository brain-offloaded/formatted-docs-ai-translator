import { AiTranslatorConfig } from '@/react/types/config';

export class TranslationInput<T = unknown> {
  constructor(
    public readonly content: string | File,
    public readonly options: T,
    public readonly aiConfig: AiTranslatorConfig,
    public readonly promptPresetContent?: string
  ) {}
}
