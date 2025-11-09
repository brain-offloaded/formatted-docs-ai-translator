import React from 'react';
import { TranslationType } from '@/react/contexts/TranslationContext';
import { ImageTranslator } from '@/react/components/translators/ImageTranslator';
import type { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';
import type { BaseTranslatorProps } from '@/react/components/translators/BaseTranslator';
import type { TranslatorConfig } from '@/react/factories/TranslatorFactory';

type TranslatorComponentProps = BaseTranslatorProps<BaseParseOptionsDto>;

interface TranslatorRendererProps {
  translationType: TranslationType;
  translatorConfig?: TranslatorConfig;
  TranslatorComponent?: React.ComponentType<TranslatorComponentProps> | null;
  parserOptions: BaseParseOptionsDto | null;
  promptPresetContent: string | null;
  currentPromptPresetName: string | null;
  onPromptPresetChange: (presetName: string, presetContent: string | undefined) => void;
  isPromptPresetLoading: boolean;
  setIsPromptPresetLoading: (value: boolean) => void;
}

export const TranslatorRenderer: React.FC<TranslatorRendererProps> = ({
  translationType,
  translatorConfig,
  TranslatorComponent,
  parserOptions,
  promptPresetContent,
  currentPromptPresetName,
  onPromptPresetChange,
  isPromptPresetLoading,
  setIsPromptPresetLoading,
}) => {
  if (translationType === TranslationType.Image) {
    return (
      <ImageTranslator
        promptPresetContent={promptPresetContent ?? undefined}
        currentPromptPresetName={currentPromptPresetName ?? ''}
        onPromptPresetChange={onPromptPresetChange}
        isPresetLoadingExternal={isPromptPresetLoading}
        setIsPresetLoadingExternal={setIsPromptPresetLoading}
      />
    );
  }

  if (!TranslatorComponent || !translatorConfig) {
    return null;
  }

  const translatorProps: TranslatorComponentProps = {
    options: translatorConfig.options,
    translationType: translatorConfig.translationType,
    formatOutput: translatorConfig.formatOutput,
    parserOptions: parserOptions ?? undefined,
    promptPresetContent: promptPresetContent ?? undefined,
  };

  return (
    <TranslatorComponent
      key={`${translationType}-${translatorConfig.translationType}`}
      {...translatorProps}
    />
  );
};
