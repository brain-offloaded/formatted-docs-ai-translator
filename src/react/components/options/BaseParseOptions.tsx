import React, { useEffect, useState, useCallback } from 'react';
import { ConfigStore } from '../../config/config-store';
import { BaseParseOptionsDto } from '@/nest/parser/dto/base-parse-options.dto';

export interface BaseParseOptionsProps<T extends BaseParseOptionsDto = BaseParseOptionsDto> {
  isTranslating: boolean;
  onOptionsChange?: (options: T) => void;
  initialOptions?: T;
}

export const BaseParseOptions = <T extends BaseParseOptionsDto = BaseParseOptionsDto>({
  onOptionsChange,
  initialOptions,
}: BaseParseOptionsProps<T>): React.ReactElement | null => {
  const configStore = ConfigStore.getInstance();
  const [options, setOptions] = useState<T>(
    (initialOptions || { sourceLanguage: configStore.getConfig().sourceLanguage }) as T
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

  // 기본 sourceLanguage 옵션 업데이트
  useEffect(() => {
    handleOptionsChange({
      sourceLanguage: configStore.getConfig().sourceLanguage,
    } as Partial<T>);
  }, [configStore, handleOptionsChange]);

  // 기본 파싱 옵션에는 UI가 없음
  return null;
};

export default BaseParseOptions;
