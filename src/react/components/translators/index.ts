import { TranslationType } from '../../contexts/TranslationContext';
import { TranslatorFactory } from '../../factories/TranslatorFactory';

// 각 번역기 타입에 맞는 번역기 컴포넌트 생성
export const JsonTranslator = TranslatorFactory.createTranslator(TranslationType.Json);
export const TextTranslator = TranslatorFactory.createTranslator(TranslationType.Text);
export const CsvTranslator = TranslatorFactory.createTranslator(TranslationType.Csv);

// 기본 번역기 타입 export
export { BaseTranslator, BaseTranslatorOptions } from './BaseTranslator';
