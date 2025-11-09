import { TranslationInput } from '../domain/translation-input';
import { TranslationUnit } from '../domain/translation-unit';

export interface IParser<TInput extends TranslationInput, TIntermediate extends TranslationUnit[]> {
  parse(input: TInput): Promise<TIntermediate>;
}
