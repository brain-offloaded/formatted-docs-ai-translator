import { TranslationConfigDefinition } from '@/react/types/translation-config-types';
import { PlainTextParserOptionsDto } from '@/react/unified/domain/options/plain-text-parser-options.dto';
import { OptionType } from '@/react/components/options/DynamicOptions';

export const textConfig: TranslationConfigDefinition<PlainTextParserOptionsDto> = {
  type: 'text',
  label: '텍스트 번역',
  translator: {
    inputLabel: '텍스트 입력:',
    inputPlaceholder: '번역할 텍스트를 입력하세요...',
    inputFieldRows: 10,
    fileLabel: '텍스트 파일',
    formatOutput: (output: string): string => output,
  },
  parser: {
    options: {
      label: '텍스트 파싱 옵션',
      optionItems: [
        {
          key: 'batchRequestAcrossFiles',
          label: '파일 묶음 번역 요청',
          type: OptionType.BOOLEAN,
          description: '여러 파일을 파싱한 뒤 한 번에 번역 요청을 보냅니다.',
        },
      ],
    },
    dto: PlainTextParserOptionsDto,
  },
};
