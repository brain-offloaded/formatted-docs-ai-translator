import { TranslationConfigDefinition } from '@/react/types/translation-config-types';
import { JsonParserOptionsDto } from '@/react/unified/domain/options/json-parser-options.dto';
import { OptionType } from '@/react/components/options/DynamicOptions';

export const jsonConfig: TranslationConfigDefinition<JsonParserOptionsDto> = {
  type: 'json',
  label: 'JSON 번역',
  translator: {
    inputLabel: 'JSON 입력:',
    inputPlaceholder: '{ "key": "번역할 텍스트" }',
    inputFieldRows: 10,
    fileExtension: '.json',
    fileLabel: 'JSON 파일',
    formatOutput: (output: string): string => output,
  },
  parser: {
    options: {
      label: 'JSON 파싱 옵션',
      optionItems: [
        {
          key: 'enableRecursiveParse',
          label: '재귀적 JSON 파싱',
          type: OptionType.BOOLEAN,
          description: '문자열로 직렬화된 JSON 값을 해제해 중첩 텍스트를 번역합니다.',
        },
      ],
    },
    dto: JsonParserOptionsDto,
  },
};
