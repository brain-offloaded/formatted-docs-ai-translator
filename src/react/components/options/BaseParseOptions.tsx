import React, { useEffect, useCallback, useMemo } from 'react';
import { ConfigStore } from '../../config/config-store';
import { BaseParseOptionsDto } from '@/nest/parser/dto/base-parse-options.dto';
import { TranslationType } from '../../contexts/TranslationContext';
import { getDefaultOptions } from '../../constants/TranslationTypeMapping';
import { OptionsValues, DynamicOptions, OptionItem } from './DynamicOptions';
import { Box, Tooltip, IconButton, Typography, FormControlLabel, Switch } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

// BaseParseOptionsProps 인터페이스를 여기서 정의하고 제네릭 제거
interface BaseParseOptionsProps {
  isTranslating: boolean;
  onOptionsChange?: (options: BaseParseOptionsDto) => void; // 타입을 BaseParseOptionsDto로 고정
  initialOptions?: BaseParseOptionsDto; // 타입을 BaseParseOptionsDto로 고정
  translationType?: TranslationType;
  optionItems?: OptionItem[];
  label?: string;
  showSettings?: boolean;
  onToggleSettings?: () => void;
}

// 로컬 스토리지 키 생성 함수
const getLocalStorageKey = (translationType?: TranslationType): string => {
  if (!translationType) return 'parse_options_default';
  return `parse_options_${translationType}`;
};

// 로컬 스토리지에서 옵션 불러오기 (제네릭 제거)
const loadOptionsFromLocalStorage = (
  translationType?: TranslationType
): BaseParseOptionsDto | null => {
  try {
    const key = getLocalStorageKey(translationType);
    const savedOptions = localStorage.getItem(key);
    if (savedOptions) {
      // 타입을 BaseParseOptionsDto로 단언
      return JSON.parse(savedOptions) as BaseParseOptionsDto;
    }
  } catch (e) {
    console.error('로컬 스토리지에서 옵션을 불러오는 중 오류 발생:', e);
  }
  return null;
};

// 로컬 스토리지에 옵션 저장 (제네릭 제거)
const saveOptionsToLocalStorage = (
  options: BaseParseOptionsDto,
  translationType?: TranslationType
): void => {
  try {
    const key = getLocalStorageKey(translationType);
    localStorage.setItem(key, JSON.stringify(options));
  } catch (e) {
    console.error('로컬 스토리지에 옵션을 저장하는 중 오류 발생:', e);
  }
};

// BaseParseOptions 컴포넌트에서 제네릭 제거
export const BaseParseOptions = React.memo(
  ({
    onOptionsChange,
    initialOptions,
    translationType,
    isTranslating,
    optionItems,
    label,
    showSettings,
    onToggleSettings,
  }: BaseParseOptionsProps): React.ReactElement => {
    // ConfigStore and sourceLanguage
    const configStore = useMemo(() => ConfigStore.getInstance(), []);
    const sourceLanguage = useMemo(() => configStore.getConfig().sourceLanguage, [configStore]);

    // 결합된 옵션 아이템 - 항상 isFile 옵션 포함
    const combinedOptionItems = useMemo(() => {
      const baseItems = optionItems || [];
      return baseItems.filter((item) => item.key !== 'isFile');
    }, [optionItems]);

    // Effect to initialize options (제네릭 T 제거)
    useEffect(() => {
      if (!onOptionsChange || !translationType) {
        return;
      }

      if (!initialOptions) {
        let optionsToSet = loadOptionsFromLocalStorage(translationType);

        if (!optionsToSet) {
          // getDefaultOptions는 여전히 제네릭 타입을 반환할 수 있으므로 캐스팅
          optionsToSet = getDefaultOptions(translationType, sourceLanguage) as BaseParseOptionsDto;
        } else {
          optionsToSet = { ...optionsToSet, sourceLanguage };
        }

        if (optionsToSet.isFile === undefined) {
          optionsToSet = { ...optionsToSet, isFile: false };
        }

        if (optionsToSet) {
          onOptionsChange(optionsToSet);
        }
      } else if (initialOptions.sourceLanguage !== sourceLanguage) {
        const updatedOptions = { ...initialOptions, sourceLanguage };
        onOptionsChange(updatedOptions);
        saveOptionsToLocalStorage(updatedOptions, translationType);
      }
    }, [translationType, initialOptions, onOptionsChange, sourceLanguage]);

    // Handler for changes from DynamicOptions (제네릭 T 제거)
    const handleDynamicOptionsChange = useCallback(
      (changedValues: OptionsValues) => {
        if (onOptionsChange && initialOptions) {
          const updatedOptions = {
            ...initialOptions,
            ...changedValues,
            sourceLanguage,
          } as BaseParseOptionsDto; // 타입 단언

          onOptionsChange(updatedOptions);
          saveOptionsToLocalStorage(updatedOptions, translationType);
        }
      },
      [onOptionsChange, initialOptions, translationType, sourceLanguage]
    );

    // isFile 토글 핸들러 (제네릭 T 제거)
    const handleFileToggle = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        if (onOptionsChange && initialOptions) {
          const updatedOptions = {
            ...initialOptions,
            isFile: event.target.checked,
          } as BaseParseOptionsDto; // 타입 단언

          onOptionsChange(updatedOptions);
          saveOptionsToLocalStorage(updatedOptions, translationType);
        }
      },
      [onOptionsChange, initialOptions, translationType]
    );

    // Prepare values for DynamicOptions
    const optionsValues: OptionsValues = useMemo(() => {
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
              onClick={onToggleSettings}
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
          {' '}
          <DynamicOptions
            options={combinedOptionItems}
            values={optionsValues}
            onChange={handleDynamicOptionsChange}
            disabled={isTranslating || !initialOptions}
          />
        </Box>
      </>
    );
  }
);

export default BaseParseOptions;
