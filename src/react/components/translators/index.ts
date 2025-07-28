import { TranslatorFactory } from '../../factories/TranslatorFactory';

// 각 번역기 타입에 맞는 번역기 컴포넌트 생성
export const JsonTranslator = TranslatorFactory.createTranslator('json');
export const TextTranslator = TranslatorFactory.createTranslator('text');
export const CsvTranslator = TranslatorFactory.createTranslator('csv');

// 기본 번역기 타입 export
export { BaseTranslator, BaseTranslatorOptions } from './BaseTranslator';
