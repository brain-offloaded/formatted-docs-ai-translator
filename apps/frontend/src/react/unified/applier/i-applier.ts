import { TranslationInput } from '../domain/translation-input';
import { TranslationOutput } from '../domain/translation-output';
import { TranslationUnit } from '../domain/translation-unit';

export interface IApplier<
  TInput extends TranslationInput,
  TIntermediate extends TranslationUnit[],
  TOutput extends TranslationOutput,
> {
  apply(originalInput: TInput, translatedTexts: TIntermediate): Promise<TOutput>;
}
