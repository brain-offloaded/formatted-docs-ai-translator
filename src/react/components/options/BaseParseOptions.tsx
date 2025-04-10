import React, { useEffect, useState, useCallback } from 'react';
import { ConfigStore } from '../../config/config-store';
import { BaseParseOptionsDto } from '@/nest/parser/dto/base-parse-options.dto';
import { TranslationType } from '../../contexts/TranslationContext';
import { getDefaultOptions } from '../../constants/TranslationTypeMapping';
import { OptionItem, OptionsValues, DynamicOptions } from './DynamicOptions';
import { Box } from '@mui/material';

export interface BaseParseOptionsProps<T extends BaseParseOptionsDto = BaseParseOptionsDto> {
  isTranslating: boolean;
  onOptionsChange?: (options: T) => void;
  initialOptions?: T;
  translationType?: TranslationType;
  optionItems?: OptionItem[]; // 동적 옵션 항목 배열
}

export type OptionFieldConfig<T> = {
  key: keyof T;
  label?: string;
  helperText?: string;
  type?: 'text' | 'switch' | 'select';
  options?: { value: string; label: string }[];
};

// 로컬 스토리지 키 생성 함수
const getLocalStorageKey = (translationType?: TranslationType): string => {
  if (!translationType) return 'parse_options_default';
  return `parse_options_${translationType}`;
};

// 로컬 스토리지에서 옵션 불러오기
const loadOptionsFromLocalStorage = <T extends BaseParseOptionsDto>(
  translationType?: TranslationType
): T | null => {
  try {
    const key = getLocalStorageKey(translationType);
    const savedOptions = localStorage.getItem(key);
    if (savedOptions) {
      return JSON.parse(savedOptions) as T;
    }
  } catch (e) {
    console.error('로컬 스토리지에서 옵션을 불러오는 중 오류 발생:', e);
  }
  return null;
};

// 로컬 스토리지에 옵션 저장
const saveOptionsToLocalStorage = <T extends BaseParseOptionsDto>(
  options: T,
  translationType?: TranslationType
): void => {
  try {
    const key = getLocalStorageKey(translationType);
    localStorage.setItem(key, JSON.stringify(options));
  } catch (e) {
    console.error('로컬 스토리지에 옵션을 저장하는 중 오류 발생:', e);
  }
};

export const useParseOptions = <T extends BaseParseOptionsDto>(
  initialOptions?: T,
  translationType?: TranslationType,
  onOptionsChange?: (options: T) => void,
  _optionItems?: OptionItem[]
) => {
  const configStore = ConfigStore.getInstance();
  const sourceLanguage = configStore.getConfig().sourceLanguage;

  // 기본값 설정 - 순서대로 시도: 로컬 스토리지 > 초기 옵션 > 기본 옵션
  const getInitialState = (): T => {
    // 1. 로컬 스토리지에서 불러오기
    const savedOptions = loadOptionsFromLocalStorage<T>(translationType);
    if (savedOptions) {
      // sourceLanguage는 항상 최신 값으로 업데이트
      return { ...savedOptions, sourceLanguage } as T;
    }

    // 2. initialOptions가 있으면 사용
    if (initialOptions) {
      return { ...initialOptions, sourceLanguage } as T;
    }

    // 3. translationType이 있으면 기본 옵션 생성
    if (translationType) {
      return getDefaultOptions(translationType, sourceLanguage) as T;
    }

    // 4. 최후의 경우 sourceLanguage만 포함한 기본 옵션 반환
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

        // 로컬 스토리지에 변경된 옵션 저장
        saveOptionsToLocalStorage(updatedOptions, translationType);

        return updatedOptions;
      });
    },
    [onOptionsChange, translationType]
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

  // DynamicOptions 값 변경 처리 함수
  const handleDynamicOptionsChange = useCallback(
    (values: OptionsValues) => {
      const partialOptions: Partial<T> = {};
      // OptionsValues 객체의 값을 T 타입에 맞게 변환하여 적용
      Object.entries(values).forEach(([key, value]) => {
        partialOptions[key as keyof T] = value as T[keyof T];
      });
      handleOptionsChange(partialOptions);
    },
    [handleOptionsChange]
  );

  // 번역 타입이 변경될 때 옵션 업데이트 - 로컬 스토리지에서 해당 타입의 저장된 옵션 불러오기
  useEffect(() => {
    if (translationType) {
      // 로컬 스토리지에서 해당 번역 타입의 옵션 불러오기
      const savedOptions = loadOptionsFromLocalStorage<T>(translationType);

      if (savedOptions) {
        // sourceLanguage는 항상 최신 값으로 업데이트
        setOptions({ ...savedOptions, sourceLanguage } as T);
      } else if (initialOptions) {
        // 저장된 옵션이 없으면 초기 옵션 사용
        setOptions({ ...initialOptions, sourceLanguage } as T);
      } else {
        // 초기 옵션도 없으면 기본 옵션 생성
        const defaultOptions = getDefaultOptions(translationType, sourceLanguage) as T;
        setOptions(defaultOptions);
      }
    }
  }, [translationType, sourceLanguage, initialOptions]);

  // 초기 옵션이 변경될 때 상태 업데이트
  useEffect(() => {
    if (initialOptions) {
      setOptions(
        (prevOptions) =>
          ({
            ...prevOptions,
            ...initialOptions,
            sourceLanguage, // 항상 최신 sourceLanguage 유지
          }) as T
      );
    }
  }, [initialOptions, sourceLanguage]);

  // 기본 sourceLanguage 옵션 업데이트
  useEffect(() => {
    handleOptionsChange({
      sourceLanguage: configStore.getConfig().sourceLanguage,
    } as Partial<T>);
  }, [configStore, handleOptionsChange]);

  return {
    options,
    setOptions,
    handleOptionsChange,
    createFieldChangeHandler,
    handleDynamicOptionsChange,
  };
};

export const BaseParseOptions = <T extends BaseParseOptionsDto = BaseParseOptionsDto>({
  onOptionsChange,
  initialOptions,
  translationType,
  isTranslating,
  optionItems,
}: BaseParseOptionsProps<T>): React.ReactElement => {
  // useParseOptions 훅 사용
  const { options, handleDynamicOptionsChange } = useParseOptions<T>(
    initialOptions,
    translationType,
    onOptionsChange,
    optionItems
  );

  // 현재 옵션 값을 DynamicOptions 용 값으로 변환
  const optionsValues: OptionsValues = { ...(options as unknown as OptionsValues) };

  // optionItems가 있는 경우에만 DynamicOptions 렌더링
  if (optionItems && optionItems.length > 0) {
    return (
      <Box sx={{ mb: 2 }}>
        <DynamicOptions
          options={optionItems}
          values={optionsValues}
          onChange={handleDynamicOptionsChange}
          disabled={isTranslating}
        />
      </Box>
    );
  }

  // 기본 파싱 옵션에는 UI가 없음
  return <></>;
};

export default BaseParseOptions;
