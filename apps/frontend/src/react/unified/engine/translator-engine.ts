import { TranslationStrategy } from '../domain/translation-strategy';
import { TranslationInput } from '../domain/translation-input';
import { TranslationOutput } from '../domain/translation-output';
import { TranslationUnit } from '../domain/translation-unit';
import { AiTranslatorConfig } from '@/react/types/config';

export type ProgressPhase = 'parsing' | 'translating' | 'applying' | 'done';

export type ProgressCallback = (phase: ProgressPhase, progress: number) => void;

export class TranslatorEngine<
  TInput extends TranslationInput,
  TIntermediate extends TranslationUnit[],
  TOutput extends TranslationOutput,
> {
  private readonly strategy: TranslationStrategy<TInput>;

  constructor(strategy: TranslationStrategy<TInput>) {
    this.strategy = strategy;
  }

  async translate(input: TInput, onProgress?: ProgressCallback): Promise<TOutput> {
    onProgress?.('parsing', 0);
    const parsed = await this.strategy.parser.parse(input);
    onProgress?.('parsing', 100);

    onProgress?.('translating', 0);
    let sourceFilePath: string | undefined;
    const extractPath = (f: File): string | undefined => {
      // Electron 환경에서는 File 객체에 path 속성이 동적으로 존재할 수 있음
      return typeof (f as unknown as { path?: string }).path === 'string'
        ? (f as unknown as { path: string }).path
        : undefined;
    };
    if (input.content instanceof File) {
      sourceFilePath = extractPath(input.content);
    }
    const translated = await this.strategy.translator.translate(
      parsed,
      input.aiConfig,
      input.promptPresetContent,
      sourceFilePath
    );
    onProgress?.('translating', 100);

    onProgress?.('applying', 0);
    const output = await this.strategy.applier.apply(input, translated as TIntermediate);
    onProgress?.('applying', 100);

    onProgress?.('done', 100);
    return output as TOutput;
  }

  async parse(input: TInput): Promise<TIntermediate> {
    return (await this.strategy.parser.parse(input)) as TIntermediate;
  }

  async translateUnits(
    units: TranslationUnit[],
    config: AiTranslatorConfig,
    promptPresetContent?: string,
    sourceFilePath?: string
  ): Promise<TranslationUnit[]> {
    return this.strategy.translator.translate(units, config, promptPresetContent, sourceFilePath);
  }

  async apply(input: TInput, translated: TIntermediate): Promise<TOutput> {
    return (await this.strategy.applier.apply(input, translated)) as TOutput;
  }
}
