import { translationConfigs } from '../config/translation-configs';
import { TranslatorFactory, TranslatorConfig } from './TranslatorFactory';
import { ParseOptionsFactory, ParseOptionsConfig } from './ParseOptionsFactory';
export function registerAllFromConfigs(): void {
  translationConfigs.forEach((config) => {
    const translatorConfig: TranslatorConfig = {
      options: {
        inputLabel: config.translator.inputLabel,
        inputPlaceholder: config.translator.inputPlaceholder,
        translationType: config.type,
        inputFieldRows: config.translator.inputFieldRows,
        fileExtension: config.translator.fileExtension,
        fileLabel: config.translator.fileLabel,
      },
      parseChannel: config.translator.ipc.parse,
      applyChannel: config.translator.ipc.apply,
      formatOutput: config.translator.formatOutput,
    };

    const parseOptionsConfig: ParseOptionsConfig = {
      label: config.parser.options.label,
      optionItems: config.parser.options.optionItems,
    };

    TranslatorFactory.registerTranslator(config.type, translatorConfig);
    ParseOptionsFactory.registerParseOptions(config.type, parseOptionsConfig);
  });
}
