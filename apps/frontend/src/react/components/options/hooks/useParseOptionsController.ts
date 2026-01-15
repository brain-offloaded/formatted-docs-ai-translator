import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { BaseParseOptionsDto } from '@/react/unified/domain/options/base-parse-options.dto';
import type { TranslationType } from '@/react/contexts/TranslationContext';
import type { OptionsValues, OptionItem } from '../DynamicOptions';
import { translationConfigs } from '@/react/config/translation-configs';

const getLocalStorageKey = (translationType?: TranslationType): string => {
  if (!translationType) return 'parse_options_default';
  return `parse_options_${translationType}`;
};

const loadOptionsFromLocalStorage = <T extends BaseParseOptionsDto>(
  translationType?: TranslationType
): T | null => {
  try {
    const key = getLocalStorageKey(translationType);
    const savedOptions = localStorage.getItem(key);
    if (savedOptions) {
      return JSON.parse(savedOptions) as T;
    }
  } catch (error) {
    console.error('로컬 스토리지에서 옵션을 불러오는 중 오류 발생:', error);
  }
  return null;
};

const saveOptionsToLocalStorage = <T extends BaseParseOptionsDto>(
  options: T,
  translationType?: TranslationType
): void => {
  try {
    const key = getLocalStorageKey(translationType);
    localStorage.setItem(key, JSON.stringify(options));
  } catch (error) {
    console.error('로컬 스토리지에 옵션을 저장하는 중 오류 발생:', error);
  }
};

interface UseParseOptionsControllerProps<T extends BaseParseOptionsDto> {
  translationType?: TranslationType;
  initialOptions: T | null;
  onOptionsChange?: (options: T) => void;
  sourceLanguage: string;
  optionItems?: OptionItem[];
}

export const useParseOptionsController = <T extends BaseParseOptionsDto>({
  translationType,
  initialOptions,
  onOptionsChange,
  sourceLanguage,
  optionItems,
}: UseParseOptionsControllerProps<T>) => {
  const prevOptionsRef = useRef<T | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const combinedOptionItems = useMemo<OptionItem[]>(() => {
    const baseItems = optionItems || [];
    return baseItems.filter((item) => item.key !== 'isFile');
  }, [optionItems]);

  useEffect(() => {
    if (!onOptionsChange || !translationType) {
      return;
    }

    if (
      initialOptions &&
      prevOptionsRef.current &&
      JSON.stringify(initialOptions) === JSON.stringify(prevOptionsRef.current) &&
      initialOptions.sourceLanguage === sourceLanguage
    ) {
      return;
    }

    if (!initialOptions) {
      let optionsToSet = loadOptionsFromLocalStorage<T>(translationType);

      const config = translationConfigs.find((c) => c.type === translationType);
      const defaultOptions = (config?.parser.dto ? new config.parser.dto() : {}) as T;

      if (!optionsToSet) {
        optionsToSet = {
          ...defaultOptions,
          sourceLanguage,
        } as T;
      } else {
        optionsToSet = { ...defaultOptions, ...optionsToSet, sourceLanguage };
      }

      if (optionsToSet.isFile === undefined) {
        optionsToSet = { ...optionsToSet, isFile: false } as T;
      }

      if (optionsToSet.batchRequestAcrossFiles === undefined) {
        optionsToSet = { ...optionsToSet, batchRequestAcrossFiles: false } as T;
      }

      if (optionsToSet) {
        onOptionsChange(optionsToSet);
        prevOptionsRef.current = optionsToSet;
      }
      return;
    }

    if (initialOptions.sourceLanguage !== sourceLanguage) {
      const updatedOptions = { ...initialOptions, sourceLanguage };
      onOptionsChange(updatedOptions);
      prevOptionsRef.current = updatedOptions;
      saveOptionsToLocalStorage(updatedOptions, translationType);
    }
  }, [initialOptions, onOptionsChange, sourceLanguage, translationType]);

  const scheduleSave = useCallback(
    (options: T) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveOptionsToLocalStorage(options, translationType);
        saveTimeoutRef.current = null;
      }, 300);
    },
    [translationType]
  );

  const handleDynamicOptionsChange = useCallback(
    (changedValues: OptionsValues) => {
      if (!onOptionsChange || !initialOptions) {
        return;
      }

      let hasChanged = false;
      for (const [key, value] of Object.entries(changedValues)) {
        if (initialOptions[key as keyof T] !== value) {
          hasChanged = true;
          break;
        }
      }

      if (!hasChanged) return;

      const updatedOptions = {
        ...initialOptions,
        ...changedValues,
        sourceLanguage,
      } as T;

      onOptionsChange(updatedOptions);
      prevOptionsRef.current = updatedOptions;
      scheduleSave(updatedOptions);
    },
    [initialOptions, onOptionsChange, scheduleSave, sourceLanguage]
  );

  const handleFileToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!onOptionsChange || !initialOptions) {
        return;
      }

      const isFile = event.target.checked;
      if (initialOptions.isFile === isFile) {
        return;
      }

      const updatedOptions = {
        ...initialOptions,
        isFile,
      } as T;

      onOptionsChange(updatedOptions);
      prevOptionsRef.current = updatedOptions;
      scheduleSave(updatedOptions);
    },
    [initialOptions, onOptionsChange, scheduleSave]
  );

  const optionsValues: OptionsValues = useMemo(() => {
    return initialOptions ? { ...(initialOptions as unknown as OptionsValues) } : {};
  }, [initialOptions]);

  const isFileChecked = useMemo(() => initialOptions?.isFile || false, [initialOptions?.isFile]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    combinedOptionItems,
    handleDynamicOptionsChange,
    handleFileToggle,
    optionsValues,
    isFileChecked,
  };
};
