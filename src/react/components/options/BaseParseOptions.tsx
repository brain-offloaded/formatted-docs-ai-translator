import React, { useEffect } from 'react';
import { ConfigStore } from '../../config/config-store';
import { BaseParseOptionsDto } from '@/nest/parser/dto/base-parse-options.dto';

export interface BaseParseOptionsProps<T extends BaseParseOptionsDto = BaseParseOptionsDto> {
  isTranslating: boolean;
  onOptionsChange?: (options: T) => void;
  initialOptions?: T;
}

export const BaseParseOptions: React.FC<BaseParseOptionsProps> = ({ onOptionsChange }) => {
  const configStore = ConfigStore.getInstance();

  // 기본 옵션 초기화 및 상태 관리
  useEffect(() => {
    // sourceLanguage는 항상 ConfigStore에서 최신 값을 가져옴
    const options: BaseParseOptionsDto = {
      sourceLanguage: configStore.getConfig().sourceLanguage,
    };

    // 부모 컴포넌트에 옵션 변경 알림
    if (onOptionsChange) {
      onOptionsChange(options);
    }
  }, [configStore, onOptionsChange]);

  // 기본 파싱 옵션에는 UI가 없음
  return null;
};

export default BaseParseOptions;
