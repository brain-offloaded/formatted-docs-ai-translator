import { useMemo } from 'react';
import { TranslationType } from '@/react/contexts/TranslationContext';
import { TranslatorFactory } from '@/react/factories/TranslatorFactory';
import { ParseOptionsFactory } from '@/react/factories/ParseOptionsFactory';
import { getTranslationTypeLabel } from '@/react/constants/TranslationTypeMapping';

export const useTranslatorFactories = (translationType: TranslationType) => {
  const translatorConfig = useMemo(
    () => TranslatorFactory.getConfig(translationType),
    [translationType]
  );

  const TranslatorComponent = useMemo(
    () => TranslatorFactory.createTranslator(translationType),
    [translationType]
  );

  const OptionComponent = useMemo(
    () => ParseOptionsFactory.createParseOptions(translationType),
    [translationType]
  );

  const translationTypeLabel = useMemo(
    () => getTranslationTypeLabel(translationType),
    [translationType]
  );

  return {
    translatorConfig,
    TranslatorComponent,
    OptionComponent,
    translationTypeLabel,
  };
};
