import React, { useMemo } from 'react';
import FileUploader from '../common/FileUploader';
import PromptPresetSelectorMinimal from '../translation/PromptPresetSelectorMinimal';
import { PromptPresetDto } from '@/react/api/generated/models/PromptPresetDto';
import { TranslationType } from '../../contexts/TranslationContext';
import { BaseTranslator } from './BaseTranslator';
import { useAdvancedImageViewer } from '../../hooks/useAdvancedImageViewer';
import { useImagePromptSelection } from './hooks/useImagePromptSelection';
import { ImageTranslationResult } from './ImageTranslationResult';
import { useTranslation } from 'react-i18next';

interface ImageTranslatorProps {
  promptPresetContent?: string;
  currentPromptPresetName?: string;
  onPromptPresetChange?: (name: string, content: string | undefined) => void;
  isPresetLoadingExternal?: boolean;
  setIsPresetLoadingExternal?: (loading: boolean) => void;
}

export const ImageTranslator: React.FC<ImageTranslatorProps> = ({
  promptPresetContent: initialPrompt,
  currentPromptPresetName,
  onPromptPresetChange,
  isPresetLoadingExternal,
  setIsPresetLoadingExternal,
}) => {
  const { t } = useTranslation();
  const {
    promptPresetContent,
    isPresetLoading,
    setIsPresetLoading,
    handlePresetChange,
    lastImagePromptPresetName,
    sourceLanguage,
  } = useImagePromptSelection({
    initialPrompt,
    onPresetChange: onPromptPresetChange,
  });
  const { openInAdvancedViewer } = useAdvancedImageViewer();

  const presetLoading = useMemo(
    () => isPresetLoadingExternal ?? isPresetLoading,
    [isPresetLoadingExternal, isPresetLoading]
  );

  const setPresetLoading = setIsPresetLoadingExternal ?? setIsPresetLoading;

  const activePresetName = useMemo(
    () => currentPromptPresetName || lastImagePromptPresetName || '',
    [currentPromptPresetName, lastImagePromptPresetName]
  );

  return (
    <BaseTranslator
      options={{
        inputLabel: '',
        inputPlaceholder: '',
        translationType: 'image',
        fileExtension: 'image/*',
        fileLabel: t('imageTranslator.selectOrDrag'),
      }}
      translationType={TranslationType.Image}
      parserOptions={{ isFile: true, sourceLanguage }}
      promptPresetContent={promptPresetContent}
      renderHeader={({ input, handleFileChange, handleClearFilesLocal, isTranslating }) => (
        <>
          <PromptPresetSelectorMinimal
            currentPresetName={activePresetName}
            onPresetChange={handlePresetChange}
            isTranslating={isTranslating}
            type={PromptPresetDto.type.IMAGE}
            isPresetLoading={presetLoading}
            setIsPresetLoading={setPresetLoading}
          />
          <FileUploader
            isDisabled={isTranslating}
            selectedFiles={input as File[]}
            onFileChange={handleFileChange}
            onClearFiles={handleClearFilesLocal}
            fileExtension="image/*"
            label={t('imageTranslator.imageFile')}
          />
        </>
      )}
      renderResult={({ resultState, shouldShowDownloadButton, handleDownload }) => (
        <ImageTranslationResult
          resultState={resultState}
          shouldShowDownloadButton={shouldShowDownloadButton}
          handleDownload={handleDownload}
          openInAdvancedViewer={openInAdvancedViewer}
        />
      )}
    />
  );
};
