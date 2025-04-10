import React, { useEffect, useState, useCallback } from 'react';
import { ConfigStore } from '../../config/config-store';
import { BaseParseOptionsDto } from '@/nest/parser/dto/base-parse-options.dto';
import { TranslationType } from '../../contexts/TranslationContext';
import { getDefaultOptions } from '../../constants/TranslationTypeMapping';

export interface BaseParseOptionsProps<T extends BaseParseOptionsDto = BaseParseOptionsDto> {
  isTranslating: boolean;
  onOptionsChange?: (options: T) => void;
  initialOptions?: T;
  translationType?: TranslationType;
}

export type OptionFieldConfig<T> = {
  key: keyof T;
  label?: string;
  helperText?: string;
  type?: 'text' | 'switch' | 'select';
  options?: { value: string; label: string }[];
};

export const useParseOptions = <T extends BaseParseOptionsDto>(
  initialOptions?: T,
  translationType?: TranslationType,
  onOptionsChange?: (options: T) => void
) => {
  const configStore = ConfigStore.getInstance();
  const sourceLanguage = configStore.getConfig().sourceLanguage;

  // 기본값 설정
  const getInitialState = (): T => {
    if (initialOptions) {
      return initialOptions;
    }

    if (translationType) {
      return getDefaultOptions(translationType, sourceLanguage) as T;
    }

    return { sourceLanguage } as T;
  };

  const [options, setOptions] = useState<T>(getInitialState());

  // 옵션 변경 핸들러
  const handleOptionsChange = useCallback(
    (newOptions: Partial<T>) => {
      setOptions((prevOptions) => {
        const updatedOptions = {
          ...prevOptions,
          ...newOptions,
        } as T;

        // 부모 컴포넌트에 옵션 변경 알림
        if (onOptionsChange) {
          onOptionsChange(updatedOptions);
        }

        return updatedOptions;
      });
    },
    [onOptionsChange]
  );

  // 특정 필드 값 변경 핸들러
  const createFieldChangeHandler = useCallback(
    <K extends keyof T>(fieldName: K) => {
      return (value: T[K]) => {
        const partialOptions: Partial<T> = {};
        partialOptions[fieldName] = value;
        handleOptionsChange(partialOptions);
      };
    },
    [handleOptionsChange]
  );

  // 초기 옵션이 변경될 때 상태 업데이트
  useEffect(() => {
    if (initialOptions) {
      setOptions(
        (prevOptions) =>
          ({
            ...prevOptions,
            ...initialOptions,
          }) as T
      );
    }
  }, [initialOptions]);

  // 기본 sourceLanguage 옵션 업데이트
  useEffect(() => {
    handleOptionsChange({
      sourceLanguage: configStore.getConfig().sourceLanguage,
    } as Partial<T>);
  }, [configStore, handleOptionsChange]);

  return {
    options,
    handleOptionsChange,
    createFieldChangeHandler,
  };
};

export const BaseParseOptions = <T extends BaseParseOptionsDto = BaseParseOptionsDto>({
  onOptionsChange,
  initialOptions,
  translationType,
}: BaseParseOptionsProps<T>): React.ReactElement | null => {
  // useParseOptions 훅 사용
  useParseOptions(initialOptions, translationType, onOptionsChange);

  // 기본 파싱 옵션에는 UI가 없음
  return null;
};

export default BaseParseOptions;
