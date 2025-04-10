// import React from 'react';
// import { BaseTranslator, TranslatorOptions } from './BaseTranslator';
// import { TranslationType } from '../../contexts/TranslationContext';
// import {
//   TextInput,
//   TextOutput,
//   TextParserResult,
//   parseTextInput,
//   translateTextContent,
//   applyTranslation,
// } from '../../translators/text';

// // 마크다운 번역기 (텍스트 번역기 기반으로 확장)
// const MarkdownTranslator: React.FC = () => {
//   // 번역기 옵션 설정
//   const markdownTranslatorOptions: TranslatorOptions<TextInput> = {
//     inputLabel: '마크다운 입력:',
//     inputPlaceholder: '번역할 마크다운 텍스트를 입력하세요.',
//     resultFileType: 'text/markdown',

//     // 번역 타입 - Text 사용 (Markdown 타입 없음)
//     translationType: TranslationType.Text,

//     // 입력 필드 행 수 (선택)
//     inputFieldRows: 15,
//   };

//   // 출력 포맷 함수
//   const formatOutput = (output: TextOutput): string => {
//     return output.translatedText;
//   };

//   return (
//     <BaseTranslator<TextInput, TextOutput>
//       options={markdownTranslatorOptions}
//       parseChannel={IpcChannel.ParseMarkdown}
//       translateChannel={IpcChannel.TranslateTextArray}
//       applyChannel={IpcChannel.ApplyTranslationToMarkdown}
//       formatOutput={formatOutput}
//     />
//   );
// };

// export default MarkdownTranslator;
