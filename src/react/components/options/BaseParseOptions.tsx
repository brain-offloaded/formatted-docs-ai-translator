import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ConfigStore } from '../../config/config-store';
import { BaseParseOptionsDto } from '@/nest/parser/dto/base-parse-options.dto';
import { TranslationType } from '../../contexts/TranslationContext';
import { getDefaultOptions } from '../../constants/TranslationTypeMapping';
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

export const BaseParseOptions = <T extends BaseParseOptionsDto = BaseParseOptionsDto>({
  onOptionsChange,
  initialOptions, // This is the state from the parent (parserOptions)
  translationType,
  isTranslating,
  optionItems,
  label,
}: BaseParseOptionsProps<T>): React.ReactElement => {
  // ConfigStore and sourceLanguage
  const configStore = useMemo(() => ConfigStore.getInstance(), []);
  const sourceLanguage = useMemo(() => configStore.getConfig().sourceLanguage, [configStore]);

  // Settings panel visibility
  const [showSettings, setShowSettings] = useState(false);
  const toggleSettings = useCallback(() => setShowSettings((prev) => !prev), []);

  // 결합된 옵션 아이템 - 항상 isFile 옵션 포함
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

    if (!initialOptions) {
      // Parent state is null, initialize it
      let optionsToSet = loadOptionsFromLocalStorage<T>(translationType);

      if (!optionsToSet) {
        optionsToSet = getDefaultOptions(translationType, sourceLanguage) as T;
      } else {
        optionsToSet = { ...optionsToSet, sourceLanguage };
      }

      // isFile 옵션이 없으면 기본값 설정
      if (optionsToSet.isFile === undefined) {
        optionsToSet = { ...optionsToSet, isFile: false };
      }

      if (optionsToSet) {
        onOptionsChange(optionsToSet); // Update parent state
        // No need to save here, as loading/defaulting handles the initial state
        // saveOptionsToLocalStorage(optionsToSet, translationType);
      }
    } else if (initialOptions.sourceLanguage !== sourceLanguage) {
      // Parent state exists, but sourceLanguage needs update
      const updatedOptions = { ...initialOptions, sourceLanguage };
      onOptionsChange(updatedOptions);
      // Save the update with the correct sourceLanguage
      saveOptionsToLocalStorage(updatedOptions, translationType);
    }
    // We depend on initialOptions being potentially null/defined,
    // and its sourceLanguage value vs the current sourceLanguage.
    // translationType and onOptionsChange are also dependencies.
  }, [translationType, initialOptions, onOptionsChange, sourceLanguage]);

  // Handler for changes from DynamicOptions
  const handleDynamicOptionsChange = useCallback(
    (changedValues: OptionsValues) => {
      // Ensure parent state exists before updating
      if (onOptionsChange && initialOptions) {
        const updatedOptions = {
          ...initialOptions,
          ...changedValues, // Apply changes from DynamicOptions
          sourceLanguage, // Ensure sourceLanguage is current
        } as T;

        onOptionsChange(updatedOptions); // Update parent state
        saveOptionsToLocalStorage(updatedOptions, translationType); // Save changes
      }
      // If initialOptions is null, the useEffect above should handle initialization shortly.
      // We avoid updating based on potentially stale state here.
    },
    [onOptionsChange, initialOptions, translationType, sourceLanguage]
  );

  // isFile 토글 핸들러
  const handleFileToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onOptionsChange && initialOptions) {
        const updatedOptions = {
          ...initialOptions,
          isFile: event.target.checked,
        } as T;

        onOptionsChange(updatedOptions);
        saveOptionsToLocalStorage(updatedOptions, translationType);
      }
    },
    [onOptionsChange, initialOptions, translationType]
  );

  // Prepare values for DynamicOptions - use parent's state or empty object if null
  const optionsValues: OptionsValues = useMemo(() => {
    // Provide an empty object if initialOptions is null to avoid errors in DynamicOptions
    return initialOptions ? { ...(initialOptions as unknown as OptionsValues) } : {};
  }, [initialOptions]);

  return (
    <>
      {/* Settings Icon and Label */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {label && <Typography variant="body1">{label}</Typography>}
        <Tooltip title="번역 옵션">
          <IconButton
            size="small"
            onClick={toggleSettings}
            color={showSettings ? 'primary' : 'default'}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* isFile 스위치 (항상 표시) */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={initialOptions?.isFile || false}
              onChange={handleFileToggle}
              disabled={isTranslating}
            />
          }
          label="파일 경로 모드"
        />
      </Box>

      {/* Settings Panel */}
      <Box sx={{ display: showSettings ? 'block' : 'none', mb: 2 }}>
        <DynamicOptions
          options={combinedOptionItems}
          values={optionsValues} // Pass the derived value based on parent's state
          onChange={handleDynamicOptionsChange} // Call handler that updates parent state
          disabled={isTranslating || !initialOptions} // Disable if translating or parent state not yet initialized
        />
      </Box>
    </>
  );
};

export default BaseParseOptions;
