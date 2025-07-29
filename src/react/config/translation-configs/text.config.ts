import { TranslationConfigDefinition } from '@/react/types/translation-config-types';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { PlainTextParserOptionsDto } from '@/nest/parser/dto/options/plain-text-parser-options.dto';

export const textConfig: TranslationConfigDefinition<PlainTextParserOptionsDto> = {
  type: 'text',
  label: '텍스트 번역',
  translator: {
    inputLabel: '텍스트 입력:',
    inputPlaceholder: '번역할 텍스트를 입력하세요...',
    inputFieldRows: 10,
    fileLabel: '텍스트 파일',
    ipc: {
      parse: IpcChannel.ParsePlainText,
      apply: IpcChannel.ApplyTranslationToPlainText,
    },
    formatOutput: (output: string): string => output,
  },
  parser: {
    options: {
      label: '텍스트 파싱 옵션',
    },
    dto: PlainTextParserOptionsDto,
  },
};
