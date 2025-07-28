import { IpcChannel } from '@/nest/common/ipc.channel';
import { OptionItem } from '../components/options/DynamicOptions';
import { BaseParseOptionsDto } from '@/nest/parser/dto/options/base-parse-options.dto';

type Constructor<T> = new (...args: any[]) => T;

export interface TranslationConfigDefinition<T extends BaseParseOptionsDto> {
  type: string;
  label: string;
  translator: {
    inputLabel: string;
    inputPlaceholder: string;
    inputFieldRows?: number;
    fileExtension?: string;
    fileLabel?: string;
    ipc: {
      parse: IpcChannel;
      apply: IpcChannel;
    };
    formatOutput?: (output: string, isFileMode: boolean) => string;
  };
  parser: {
    options: {
      label: string;
      optionItems?: OptionItem[];
    };
    dto?: Constructor<T>;
  };
  customTranslatorComponent?: React.ComponentType<any>;
  customOptionsComponent?: React.ComponentType<any>;
}
