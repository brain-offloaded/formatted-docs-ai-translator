// 기존 인덱스 파일 내용 유지 (exports 등)
// ... existing code ...

import { ParseOptionsFactory } from '../../factories/ParseOptionsFactory';

// 각 번역기 타입에 맞는 파싱 옵션 컴포넌트 생성
export const JsonParseOption = ParseOptionsFactory.createParseOptions('json');
export const TextParseOption = ParseOptionsFactory.createParseOptions('text');
export const CsvParseOption = ParseOptionsFactory.createParseOptions('csv');

// 기본 옵션 export
export { BaseParseOptions } from './BaseParseOptions';
export { DynamicOptions, OptionType, OptionItem } from './DynamicOptions';
