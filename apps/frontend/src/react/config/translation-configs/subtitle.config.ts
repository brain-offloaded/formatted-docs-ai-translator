import { TranslationConfigDefinition } from '@/react/types/translation-config-types';
import { SubtitleParserOptionsDto } from '@/react/unified/domain/options/subtitle-parser-options.dto';
import { OptionType } from '@/react/components/options/DynamicOptions';

export const subtitleConfig: TranslationConfigDefinition<SubtitleParserOptionsDto> = {
  type: 'subtitle',
  label: '자막 번역',
  translator: {
    inputLabel: '자막 입력:',
    inputPlaceholder: '1\n00:00:01,000 --> 00:00:02,000\n번역할 텍스트',
    inputFieldRows: 10,
    fileExtension: '.srt, .vtt',
    fileLabel: '자막 파일',
    formatOutput: (output: string): string => output,
  },
  parser: {
    options: {
      label: '자막 파싱 옵션',
      optionItems: [
        {
          key: 'batchRequestAcrossFiles',
          label: '파일 묶음 번역 요청',
          type: OptionType.BOOLEAN,
          description: '여러 파일을 파싱한 뒤 한 번에 번역 요청을 보냅니다.',
        },
      ],
    },
    dto: SubtitleParserOptionsDto,
  },
};
