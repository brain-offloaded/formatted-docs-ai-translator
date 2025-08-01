import { TranslationConfigDefinition } from '@/react/types/translation-config-types';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { SubtitleParserOptionsDto } from '@/nest/parser/dto/options/subtitle-parser-options.dto';

export const subtitleConfig: TranslationConfigDefinition<SubtitleParserOptionsDto> = {
  type: 'subtitle',
  label: '자막 번역',
  translator: {
    inputLabel: '자막 입력:',
    inputPlaceholder: '1\n00:00:01,000 --> 00:00:02,000\n번역할 텍스트',
    inputFieldRows: 10,
    fileExtension: '.srt, .vtt',
    fileLabel: '자막 파일',
    ipc: {
      parse: IpcChannel.ParseSubtitle,
      apply: IpcChannel.ApplyTranslationToSubtitle,
    },
    formatOutput: (output: string): string => output,
  },
  parser: {
    options: {
      label: '자막 파싱 옵션',
    },
    dto: SubtitleParserOptionsDto,
  },
};
