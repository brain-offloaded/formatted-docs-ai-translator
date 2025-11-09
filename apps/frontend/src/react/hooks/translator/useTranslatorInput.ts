import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';

type TranslatorInput = string | File[];

interface UseTranslatorInputOptions<T extends BaseParseOptionsDto> {
  parserOptions?: T | null;
}

interface UseTranslatorInputResult<T extends BaseParseOptionsDto> {
  input: TranslatorInput;
  currentIsFileInput: boolean;
  handleInputChange: (value: TranslatorInput) => void;
  handleFileChange: (files: File[] | null) => void;
  resetInput: () => void;
  updateParserOptionsSnapshot: (options: T | null | undefined) => void;
}

export const useTranslatorInput = <T extends BaseParseOptionsDto>({
  parserOptions,
}: UseTranslatorInputOptions<T>): UseTranslatorInputResult<T> => {
  const prevParserOptionsRef = useRef<T | null>(null);

  const currentIsFileInput = useMemo(() => parserOptions?.isFile ?? false, [parserOptions?.isFile]);

  const [input, setInput] = useState<TranslatorInput>(currentIsFileInput ? [] : '');
  const prevInputRef = useRef<TranslatorInput>(currentIsFileInput ? [] : '');

  const updateParserOptionsSnapshot = useCallback((options: T | null | undefined) => {
    if (options !== undefined) {
      prevParserOptionsRef.current = options ?? null;
    }
  }, []);

  useEffect(() => {
    const previousIsFile = prevParserOptionsRef.current?.isFile ?? false;
    const nextIsFile = parserOptions?.isFile ?? false;

    if (previousIsFile !== nextIsFile) {
      const nextInput: TranslatorInput = nextIsFile ? [] : '';
      prevInputRef.current = nextInput;
      setInput(nextInput);
    }

    updateParserOptionsSnapshot(parserOptions);
  }, [parserOptions, updateParserOptionsSnapshot]);

  const handleInputChange = useCallback((value: TranslatorInput) => {
    setInput((prevInput) => {
      const isSameFileList =
        Array.isArray(value) &&
        Array.isArray(prevInput) &&
        value.length === prevInput.length &&
        value.every(
          (file, index) =>
            file.name === (prevInput as File[])[index].name &&
            file.size === (prevInput as File[])[index].size
        );

      const isSameText =
        typeof value === 'string' && typeof prevInput === 'string' && value === prevInput;

      if (isSameFileList || isSameText) {
        return prevInput;
      }

      prevInputRef.current = value;
      return value;
    });
  }, []);

  const handleFileChange = useCallback(
    (files: File[] | null) => {
      const nextFiles = files ?? [];

      if (
        Array.isArray(prevInputRef.current) &&
        Array.isArray(input) &&
        nextFiles.length === (prevInputRef.current as File[]).length &&
        nextFiles.length === (input as File[]).length &&
        nextFiles.every((file, index) => {
          const prevFile = (prevInputRef.current as File[])[index];
          const currentFile = (input as File[])[index];

          return (
            file.name === prevFile?.name &&
            file.size === prevFile?.size &&
            file.name === currentFile?.name &&
            file.size === currentFile?.size
          );
        })
      ) {
        return;
      }

      handleInputChange(nextFiles);
    },
    [handleInputChange, input]
  );

  const resetInput = useCallback(() => {
    const nextInput: TranslatorInput = currentIsFileInput ? [] : '';
    prevInputRef.current = nextInput;
    setInput(nextInput);
  }, [currentIsFileInput]);

  return {
    input,
    currentIsFileInput,
    handleInputChange,
    handleFileChange,
    resetInput,
    updateParserOptionsSnapshot,
  };
};
