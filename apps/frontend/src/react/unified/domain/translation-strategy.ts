import { IApplier } from '../applier/i-applier';
import { IParser } from '../parser/i-parser';
import { ITranslator } from '../translator/i-translator';
import { TranslationInput } from './translation-input';
import { TranslationOutput } from './translation-output';
import { TranslationUnit } from './translation-unit';

export interface TranslationStrategy<TIn extends TranslationInput = TranslationInput> {
  parser: IParser<TIn, TranslationUnit[]>;
  translator: ITranslator;
  applier: IApplier<TIn, TranslationUnit[], TranslationOutput>;
}
