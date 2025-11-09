import { OptionItem } from '../components/options/DynamicOptions';
import { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';

type Constructor<T> = new (...args: unknown[]) => T;

export interface TranslationConfigDefinition<T extends BaseParseOptionsDto> {
  type: string;
  label: string;
  translator: {
    inputLabel: string;
    inputPlaceholder: string;
    inputFieldRows?: number;
    fileExtension?: string;
    fileLabel?: string;
    formatOutput?: (output: string, isFileMode: boolean) => string;
  };
  parser: {
    options: {
      label: string;
      optionItems?: OptionItem[];
    };
    dto?: Constructor<T>;
  };
  customTranslatorComponent?: React.ComponentType;
  customOptionsComponent?: React.ComponentType;
}
