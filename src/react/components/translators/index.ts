import { TranslationType } from '../../contexts/TranslationContext';
import { getTranslatorComponent } from '../../constants/TranslationTypeMapping';

// 각 번역기 타입에 맞는 번역기 컴포넌트 생성
export const JsonTranslator = getTranslatorComponent(TranslationType.Json);
export const TextTranslator = getTranslatorComponent(TranslationType.Text);
export const CsvFileTranslator = getTranslatorComponent(TranslationType.CsvFile);

// 기본 번역기 타입 export
export { BaseTranslator, BaseTranslatorOptions, TranslatorCore } from './BaseTranslator';
