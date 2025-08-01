import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { useConfigStore } from '../../config/config-store';
import { BaseParseOptionsDto } from '@/nest/parser/dto/options/base-parse-options.dto';
import { TranslationType } from '../../contexts/TranslationContext';
import { translationConfigs } from '../../config/translation-configs';
import { OptionsValues, DynamicOptions } from './DynamicOptions';
import { Box, Tooltip, IconButton, Typography, FormControlLabel, Switch } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { BaseParseOptionsProps } from '../../types/translation-types';

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

// 로컬 스토리지에 옵션 저장 (디바운스 포함)
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

export const BaseParseOptions = <T extends BaseParseOptionsDto = BaseParseOptionsDto>({
  onOptionsChange,
  initialOptions, // This is the state from the parent (parserOptions)
  translationType,
  isTranslating,
  optionItems,
  label,
  showSettings, // props로 showSettings 받기
  onToggleSettings, // props로 onToggleSettings 받기
}: BaseParseOptionsProps<T>): React.ReactElement => {
  // useConfigStore and sourceLanguage - 메모이제이션
  const sourceLanguage = useConfigStore((state) => state.sourceLanguage);

  // 이전 옵션 저장을 위한 ref 사용
  const prevOptionsRef = useRef<T | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 디바운스된 저장 함수
  const debouncedSaveOptions = useCallback(
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

  // 결합된 옵션 아이템 - 항상 isFile 옵션 포함, 메모이제이션으로 불필요한 계산 방지
  const combinedOptionItems = useMemo(() => {
    const baseItems = optionItems || [];
    // isFile 옵션이 기존 아이템에 있다면 제거
    return baseItems.filter((item) => item.key !== 'isFile');
  }, [optionItems]);

  // Effect to initialize options in the parent if they are null or update sourceLanguage
  useEffect(() => {
    // Ensure callbacks and type are available
    if (!onOptionsChange || !translationType) {
      return;
    }

    // 이전 옵션과 새 옵션이 동일한 경우 불필요한 업데이트 방지
    if (
      initialOptions &&
      prevOptionsRef.current &&
      JSON.stringify(initialOptions) === JSON.stringify(prevOptionsRef.current) &&
      initialOptions.sourceLanguage === sourceLanguage
    ) {
      return;
    }

    if (!initialOptions) {
      // Parent state is null, initialize it
      let optionsToSet = loadOptionsFromLocalStorage<T>(translationType);

      if (!optionsToSet) {
        const config = translationConfigs.find((c) => c.type === translationType);
        const defaultOptions = config?.parser.dto ? new config.parser.dto() : {};
        optionsToSet = {
          ...defaultOptions,
          sourceLanguage,
        } as T;
      } else {
        optionsToSet = { ...optionsToSet, sourceLanguage };
      }

      // isFile 옵션이 없으면 기본값 설정
      if (optionsToSet.isFile === undefined) {
        optionsToSet = { ...optionsToSet, isFile: false };
      }

      if (optionsToSet) {
        onOptionsChange(optionsToSet); // Update parent state
        prevOptionsRef.current = optionsToSet;
      }
    } else if (initialOptions.sourceLanguage !== sourceLanguage) {
      // Parent state exists, but sourceLanguage needs update
      const updatedOptions = { ...initialOptions, sourceLanguage };
      onOptionsChange(updatedOptions);
      prevOptionsRef.current = updatedOptions;
      // Save the update with the correct sourceLanguage
      debouncedSaveOptions(updatedOptions);
    }
  }, [translationType, initialOptions, onOptionsChange, sourceLanguage, debouncedSaveOptions]);

  // Handler for changes from DynamicOptions
  const handleDynamicOptionsChange = useCallback(
    (changedValues: OptionsValues) => {
      // Ensure parent state exists before updating
      if (onOptionsChange && initialOptions) {
        // 변경된 값이 실제로 변경되었는지 확인
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
          ...changedValues, // Apply changes from DynamicOptions
          sourceLanguage, // Ensure sourceLanguage is current
        } as T;

        onOptionsChange(updatedOptions); // Update parent state
        prevOptionsRef.current = updatedOptions;
        debouncedSaveOptions(updatedOptions); // 디바운스된 저장 사용
      }
    },
    [onOptionsChange, initialOptions, sourceLanguage, debouncedSaveOptions]
  );

  // isFile 토글 핸들러
  const handleFileToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onOptionsChange && initialOptions) {
        const isFile = event.target.checked;

        // 현재 값과 동일하면 불필요한 업데이트 방지
        if (initialOptions.isFile === isFile) return;

        const updatedOptions = {
          ...initialOptions,
          isFile,
        } as T;

        onOptionsChange(updatedOptions);
        prevOptionsRef.current = updatedOptions;
        debouncedSaveOptions(updatedOptions);
      }
    },
    [onOptionsChange, initialOptions, debouncedSaveOptions]
  );

  // Prepare values for DynamicOptions - use parent's state or empty object if null
  const optionsValues: OptionsValues = useMemo(() => {
    // Provide an empty object if initialOptions is null to avoid errors in DynamicOptions
    return initialOptions ? { ...(initialOptions as unknown as OptionsValues) } : {};
  }, [initialOptions]);

  // 메모이제이션된 isFile 값
  const isFileChecked = useMemo(() => initialOptions?.isFile || false, [initialOptions?.isFile]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box
      sx={{
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        p: 2,
        bgcolor: '#f5f5f5',
        mb: 2,
      }}
    >
      {/* Settings Icon and Label */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {label && <Typography variant="body1">{label}</Typography>}
        <Tooltip title="파싱(텍스트 추출) 옵션">
          <IconButton
            size="small"
            onClick={onToggleSettings}
            color={showSettings ? 'primary' : 'default'}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Settings Panel */}
      {showSettings && (
        <Box sx={{ mb: 2 }}>
          <DynamicOptions
            options={combinedOptionItems}
            values={optionsValues}
            onChange={handleDynamicOptionsChange}
            disabled={isTranslating || !initialOptions}
          />
        </Box>
      )}

      {/* isFile 스위치 (설정 패널 아래로 이동) */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <FormControlLabel
          control={
            <Switch checked={isFileChecked} onChange={handleFileToggle} disabled={isTranslating} />
          }
          label="파일 경로 모드"
        />
      </Box>
    </Box>
  );
};

export default BaseParseOptions;
