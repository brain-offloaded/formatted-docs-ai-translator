// 기존 인덱스 파일 내용 유지 (exports 등)
// ... existing code ...

import { TranslationType } from '../../contexts/TranslationContext';
import { getParserOptionComponent } from '../../constants/TranslationTypeMapping';

// 각 번역기 타입에 맞는 파싱 옵션 컴포넌트 생성
export const JsonParseOption = getParserOptionComponent(TranslationType.Json);
export const TextParseOption = getParserOptionComponent(TranslationType.Text);
export const CsvFileParseOption = getParserOptionComponent(TranslationType.CsvFile);

// 기본 옵션 export
export { BaseParseOptions, useParseOptions } from './BaseParseOptions';
export { DynamicOptions, OptionType, OptionItem } from './DynamicOptions';
