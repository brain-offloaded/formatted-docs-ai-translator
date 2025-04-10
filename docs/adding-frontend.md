# 파서 추가 후 프론트엔드 구현 가이드

이 문서는 새로운 파서를 추가한 후 해당 파서를 프론트엔드에서 사용할 수 있도록 구현하는 방법을 설명합니다.

## 목차

- [번역 유형 추가](#번역-유형-추가)
- [파서 옵션 컴포넌트 생성](#파서-옵션-컴포넌트-생성)
- [번역기 컴포넌트 생성](#번역기-컴포넌트-생성)
- [번역 타입 매핑 추가](#번역-타입-매핑-추가)
- [유틸리티 함수 업데이트](#유틸리티-함수-업데이트)

## 번역 유형 추가

먼저 `src/react/contexts/TranslationContext.tsx` 파일에 새로운 번역 유형을 추가합니다:

```typescript
export enum TranslationType {
  Text = 'text',
  JsonFile = 'json-file',
  JsonString = 'json-string',
  // 새 번역 유형 추가
  NewFormat = 'new-format',
}
```

## 파서 옵션 컴포넌트 생성

새 파서에 필요한 옵션 설정 컴포넌트를 생성합니다:

```typescript
// src/react/components/options/NewFormatParseOption.tsx
import React, { useCallback, useState, useEffect } from 'react';
import { Box, Switch, FormControlLabel, TextField } from '@mui/material';
import { BaseParseOptionsDto } from '@/nest/parser/dto/options/base-parse-options.dto';
import { NewFormatParserOptionsDto } from '@/nest/parser/dto/options/new-format-parser-options.dto';
import { ConfigStore } from '../../config/config-store';

interface NewFormatParseOptionProps {
  isTranslating: boolean;
  onOptionsChange?: (options: NewFormatParserOptionsDto) => void;
}

const NewFormatParseOption: React.FC<NewFormatParseOptionProps> = ({
  isTranslating,
  onOptionsChange,
}) => {
  const configStore = ConfigStore.getInstance();
  const [options, setOptions] = useState<NewFormatParserOptionsDto>({
    sourceLanguage: configStore.getConfig().sourceLanguage,
    someOption: '',
    anotherOption: false,
  });

  // 옵션 변경 시 상위 컴포넌트에 전달
  useEffect(() => {
    if (onOptionsChange) {
      onOptionsChange(options);
    }
  }, [options, onOptionsChange]);

  // 옵션 변경 핸들러
  const handleOptionChange = useCallback(
    (optionName: keyof NewFormatParserOptionsDto, value: string | boolean) => {
      setOptions((prev) => ({
        ...prev,
        [optionName]: value,
      }));
    },
    []
  );

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        label="추가 옵션"
        fullWidth
        value={options.someOption}
        onChange={(e) => handleOptionChange('someOption', e.target.value)}
        disabled={isTranslating}
        size="small"
        margin="dense"
      />
      <FormControlLabel
        control={
          <Switch
            checked={options.anotherOption}
            onChange={(e) => handleOptionChange('anotherOption', e.target.checked)}
            disabled={isTranslating}
          />
        }
        label="다른 옵션"
      />
    </Box>
  );
};

export default NewFormatParseOption;
```

## 번역기 컴포넌트 생성

`BaseTranslator`를 기반으로 새 번역기 컴포넌트를 생성합니다:

```typescript
// src/react/components/translators/NewFormatTranslator.tsx
import React from 'react';
import { BaseTranslator, BaseTranslatorOptions } from './BaseTranslator';
import { TranslationType } from '../../contexts/TranslationContext';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { getParserOptionComponent } from '../../constants/TranslationTypeMapping';

const NewFormatTranslator: React.FC = () => {
  // 번역기 옵션 설정
  const newFormatTranslatorOptions: BaseTranslatorOptions = {
    inputLabel: '새 포맷 입력:',
    inputPlaceholder: '번역할 새 포맷 데이터를 입력하세요.',
    resultFileType: 'text/plain', // 또는 적절한 MIME 타입
    
    // 번역 타입
    translationType: TranslationType.NewFormat,
    
    // 파일 업로드 설정 (파일 기반 입력인 경우)
    // fileExtension: '.txt', // 파일 확장자
    // fileLabel: '새 포맷 파일', // 파일 선택 레이블
    
    // 텍스트 영역 설정 (텍스트 기반 입력인 경우)
    inputFieldRows: 12,
  };
  
  // 출력 포맷 함수
  const formatOutput = (output: string): string => {
    return output;
  };
  
  // 파서 옵션 컴포넌트 가져오기
  const OptionComponent = getParserOptionComponent(TranslationType.NewFormat);
  
  return (
    <BaseTranslator
      options={newFormatTranslatorOptions}
      parseChannel={IpcChannel.ParseNewFormat}
      applyChannel={IpcChannel.ApplyTranslationToNewFormat}
      formatOutput={formatOutput}
      OptionComponent={OptionComponent}
    />
  );
};

export default NewFormatTranslator;
```

## 번역 타입 매핑 추가

마지막으로 `src/react/constants/TranslationTypeMapping.ts` 파일을 업데이트하여 새 번역 타입과 컴포넌트 간의 매핑을 추가합니다:

```typescript
// 컴포넌트 import 추가
import NewFormatTranslator from '../components/translators/NewFormatTranslator';
import NewFormatParseOption from '../components/options/NewFormatParseOption';

/**
 * TranslationType에 따라 적절한 컴포넌트를 반환하는 함수
 */
export const getTranslatorComponent = (type: TranslationType): React.ComponentType => {
  switch (type) {
    case TranslationType.JsonFile:
      return JsonFileTranslator;
    case TranslationType.JsonString:
      return JsonStringTranslator;
    case TranslationType.Text:
      return TextTranslator;
    case TranslationType.NewFormat:
      return NewFormatTranslator;
    default:
      throw new Error('Invalid translation type');
  }
};

/**
 * TranslationType에 따라 적절한 옵션 컴포넌트를 반환하는 함수
 */
export const getParserOptionComponent = (
  type: TranslationType
): React.ComponentType<{
  isTranslating: boolean;
  onOptionsChange?: (options: BaseParseOptionsDto) => void;
}> => {
  switch (type) {
    case TranslationType.JsonFile:
      return JsonFileParseOption;
    case TranslationType.JsonString:
      return JsonStringParseOption;
    case TranslationType.Text:
      return TextParseOption;
    case TranslationType.NewFormat:
      return NewFormatParseOption;
    default:
      throw new Error('Invalid translation type');
  }
};

/**
 * TranslationType에 따라 적절한 라벨 문자열을 반환하는 함수
 */
export const getTranslationTypeLabel = (type: TranslationType): string => {
  switch (type) {
    case TranslationType.JsonFile:
      return 'JSON 파일 번역';
    case TranslationType.JsonString:
      return 'JSON 문자열 번역';
    case TranslationType.Text:
      return '텍스트 번역';
    case TranslationType.NewFormat:
      return '새 포맷 번역';
    default:
      throw new Error('Invalid translation type');
  }
};

/**
 * TranslationType 목록을 반환하는 함수
 */
export const getTranslationTypes = (): { value: TranslationType; label: string }[] => {
  return [
    {
      value: TranslationType.JsonFile,
      label: getTranslationTypeLabel(TranslationType.JsonFile),
    },
    {
      value: TranslationType.JsonString,
      label: getTranslationTypeLabel(TranslationType.JsonString),
    },
    {
      value: TranslationType.Text,
      label: getTranslationTypeLabel(TranslationType.Text),
    },
    {
      value: TranslationType.NewFormat,
      label: getTranslationTypeLabel(TranslationType.NewFormat),
    },
  ];
};
```

## 유틸리티 함수 업데이트

새로운 번역 유형을 추가할 때는 `BaseTranslator.tsx`와 다른 유틸리티 파일에 정의된 `TranslationType`을 사용하는 함수들도 업데이트해야 합니다.

### 1. BaseTranslator.tsx의 유틸리티 함수 수정

`src/react/components/translators/BaseTranslator.tsx`에서 다음 함수들을 수정합니다:

```typescript
/**
 * 입력 타입이 파일 기반인지 확인하는 함수
 * @param translationType 번역 타입
 * @returns 파일 기반 입력인 경우 true, 아닌 경우 false
 */
export const isFileInput = (translationType: TranslationType): boolean => {
  return (
    translationType === TranslationType.JsonFile ||
    // 필요한 경우 새 포맷이 파일 기반이면 여기에 추가
    translationType === TranslationType.NewFormat
  );
};

/**
 * 출력 결과를 다운로드할 수 있는지 확인하는 함수
 * @param translationType 번역 타입
 * @returns 다운로드 가능한 경우 true, 아닌 경우 false
 */
export const isDownloadable = (translationType: TranslationType): boolean => {
  return (
    isFileInput(translationType) ||
    // 파일 입력이 아니지만 다운로드 가능한 타입이 있다면 여기에 추가
    translationType === TranslationType.NewFormat
  );
};
```

### 2. 기본 초기 입력값 및 유효성 검사 함수 수정

새 번역 타입에 맞는 기본 입력값과 유효성 검사 방법을 추가합니다:

```typescript
// 기본 초기 입력값 생성 함수
const getDefaultInitialInput = (translationType: TranslationType): string | string[] => {
  if (isFileInput(translationType)) {
    return [] as unknown as string[];
  } else if (translationType === TranslationType.NewFormat) {
    // 새 포맷의 초기 입력 타입을 설정
    return '';
  } else {
    return '' as unknown as string;
  }
};

// 기본 유효성 검사 함수
const getDefaultValidator = (
  translationType: TranslationType
): ((input: string | string[]) => boolean) => {
  if (isFileInput(translationType)) {
    return (input) => (input as string[])?.length > 0;
  } else if (translationType === TranslationType.JsonString) {
    return (input) => {
      try {
        JSON.parse((input as string).trim());
        return true;
      } catch (e) {
        return false;
      }
    };
  } else if (translationType === TranslationType.NewFormat) {
    // 새 포맷의 유효성 검사 로직을 구현
    return (input) => {
      // 여기에 특정 형식 검증 로직을 구현
      return (input as string)?.trim().length > 0;
    };
  } else {
    return (input) => (input as string)?.trim().length > 0;
  }
};
```

### 3. 출력 포맷 함수 수정

특별한 출력 형식이 필요한 경우 `defaultFormatOutput` 함수를 수정합니다:

```typescript
// 기본 출력 포맷 함수
const defaultFormatOutput = <TapplyResult,>(output: TapplyResult, isFileInput: boolean): string => {
  if (isFileInput) {
    return '파일 번역이 완료되었습니다. 다운로드 버튼을 클릭하여 결과를 받으세요.';
  } else if (typeof output === 'object' && output !== null && 'newFormatSpecific' in output) {
    // 특정 포맷에 맞는 출력 형식을 구현
    return (output as { newFormatSpecific: string }).newFormatSpecific;
  } else {
    return typeof output === 'string'
      ? output
      : typeof output === 'object' && output !== null && 'translatedText' in output
        ? (output as { translatedText: string }).translatedText
        : JSON.stringify(output, null, 2);
  }
};
```

### 주의사항

새로운 번역 유형을 추가할 때는 다음 사항에 유의해야 합니다:

1. 파일 입력 여부에 따라 `isFileInput` 함수를 수정합니다.
2. 다운로드 가능 여부에 따라 `isDownloadable` 함수를 수정합니다.
3. 입력 형식에 특별한 초기값이 필요한 경우 `getDefaultInitialInput` 함수를 수정합니다.
4. 입력 검증에 특별한 로직이 필요한 경우 `getDefaultValidator` 함수를 수정합니다.
5. 출력 형식에 특별한 처리가 필요한 경우 `defaultFormatOutput` 함수를 수정합니다.

이렇게 하면 새로운 파서가 프론트엔드에서도 완전히 통합되어 사용 가능합니다. 이제 사용자는 UI에서 새로운 번역 유형을 선택하고 해당 파서의 기능을 사용할 수 있습니다. 