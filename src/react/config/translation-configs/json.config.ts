import { TranslationConfigDefinition } from '@/react/types/translation-config-types';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { JsonParserOptionsDto } from '@/nest/parser/dto/options/json-parser-options.dto';

export const jsonConfig: TranslationConfigDefinition<JsonParserOptionsDto> = {
  type: 'json',
  label: 'JSON 번역',
  translator: {
    inputLabel: 'JSON 입력:',
    inputPlaceholder: '{ "key": "번역할 텍스트" }',
    inputFieldRows: 10,
    fileExtension: '.json',
    fileLabel: 'JSON 파일',
    ipc: {
      parse: IpcChannel.ParseJson,
      apply: IpcChannel.ApplyTranslationToJson,
    },
    formatOutput: (output: string): string => output,
  },
  parser: {
    options: {
      label: 'JSON 파싱 옵션',
    },
    dto: JsonParserOptionsDto,
  },
};
