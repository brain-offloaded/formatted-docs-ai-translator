# 파서 추가 후 프론트엔드 구현 가이드

이 문서는 새로운 파서를 추가한 후 해당 파서를 프론트엔드에서 사용할 수 있도록 구현하는 방법을 설명합니다.

## 목차

- [파서 추가 후 프론트엔드 구현 가이드](#파서-추가-후-프론트엔드-구현-가이드)
  - [목차](#목차)
  - [번역 유형 추가](#번역-유형-추가)
  - [번역기 및 파싱 옵션 등록](#번역기-및-파싱-옵션-등록)
    - [번역기 설정 구성](#번역기-설정-구성)
    - [번역기 등록 함수 추가](#번역기-등록-함수-추가)
    - [파싱 옵션 설정 구성](#파싱-옵션-설정-구성)
  - [번역 유형 레이블 추가](#번역-유형-레이블-추가)
  - [사용자 정의 옵션 (선택 사항)](#사용자-정의-옵션-선택-사항)
  - [커스텀 번역기 동작 (선택 사항)](#커스텀-번역기-동작-선택-사항)
  - [주의사항](#주의사항)

## 번역 유형 추가

먼저 `src/react/contexts/TranslationContext.tsx` 파일에 새로운 번역 유형을 추가합니다:

```typescript
export enum TranslationType {
  Text = 'text',
  Json = 'json',
  Csv = 'csv',
  // 새로운 번역 유형 추가
  NewFormat = 'new-format',
}
```

## 번역기 및 파싱 옵션 등록

프로젝트는 팩토리 패턴과 레지스트리 패턴을 사용하여 번역기를 관리합니다. 새로운 번역기를 추가하려면 `TranslatorFactory`와 `ParseOptionsFactory`에 새 번역 유형을 등록해야 합니다.

### 번역기 설정 구성

`src/react/factories/TranslatorRegistration.ts` 파일에 새 번역기 등록 함수를 추가합니다:

```typescript
/**
 * 새 포맷 번역기 등록
 */
function registerNewFormatTranslator(): void {
  // 번역기 설정
  const newFormatTranslatorConfig: TranslatorConfig = {
    options: {
      inputLabel: '새 포맷 입력:',
      inputPlaceholder: '번역할 새 포맷 데이터를 입력하세요.',
      translationType: TranslationType.NewFormat,
      inputFieldRows: 10,
      // 파일 기반 입력인 경우 아래 속성 추가
      fileExtension: '.txt', // 파일 확장자
      fileLabel: '새 포맷 파일', // 파일 선택 레이블
    },
    // IPC 채널 설정
    parseChannel: IpcChannel.ParseNewFormat,
    applyChannel: IpcChannel.ApplyTranslationToNewFormat,
    // 출력 포맷 함수 (선택 사항)
    formatOutput: (output: string, isFileMode: boolean): string => {
      if (isFileMode) {
        return '파일 번역이 완료되었습니다. 다운로드 버튼을 클릭하여 결과를 받으세요.';
      }
      return output;
    },
  };

  // 파싱 옵션 설정
  const newFormatParseOptionsConfig: ParseOptionsConfig = {
    label: '새 포맷 파싱 옵션',
    // 옵션 항목 (선택 사항)
    optionItems: [
      {
        key: 'someOption',
        label: '추가 옵션',
        type: OptionType.SHORT_STRING,
        description: '추가 옵션에 대한 설명',
      },
      {
        key: 'anotherOption',
        label: '다른 옵션',
        type: OptionType.BOOLEAN,
        description: '다른 옵션에 대한 설명',
      },
    ],
  };

  // 번역기와 파싱 옵션 등록
  TranslatorFactory.registerTranslator(TranslationType.NewFormat, newFormatTranslatorConfig);
  ParseOptionsFactory.registerParseOptions(TranslationType.NewFormat, newFormatParseOptionsConfig);
}
```

### 번역기 등록 함수 추가

`registerAllTranslators` 함수에 새 번역기 등록 함수를 호출하는 코드를 추가합니다:

```typescript
/**
 * 모든 번역기와 파싱 옵션을 등록하는 함수
 */
export function registerAllTranslators(): void {
  // 기존 번역기 등록
  registerJsonTranslator();
  registerTextTranslator();
  registerCsvTranslator();
  
  // 새 번역기 등록
  registerNewFormatTranslator();
}
```

### 파싱 옵션 설정 구성

파싱 옵션에 새로운 DTO 유형을 사용하려면 `src/react/types/translation-types.ts` 파일에 새 유형을 추가합니다:

```typescript
// 새 DTO import
import { NewFormatParserOptionsDto } from '@/nest/parser/dto/options/new-format-parser-options.dto';

// TranslationType에 따른 옵션 DTO 매핑 확장
export interface TranslationTypeToOptionsMap {
  [TranslationType.Json]: JsonParserOptionsDto;
  [TranslationType.Text]: PlainTextParserOptionsDto;
  [TranslationType.Csv]: CsvParserOptionsDto;
  // 새 번역 유형에 대한 옵션 DTO 매핑 추가
  [TranslationType.NewFormat]: NewFormatParserOptionsDto;
}
```

## 번역 유형 레이블 추가

새로운 번역 유형을 추가했다면, 사용자가 UI에서 선택할 수 있도록 해당 유형에 대한 레이블을 추가해야 합니다. `src/react/constants/TranslationTypeMapping.ts` 파일의 `getTranslationTypeLabel` 함수에 새 번역 유형에 대한 case를 추가합니다:

```typescript
export const getTranslationTypeLabel = (type: TranslationType): string => {
  switch (type) {
    case TranslationType.Json:
      return 'JSON 번역';
    case TranslationType.Text:
      return '텍스트 번역';
    case TranslationType.Csv:
      return 'CSV 번역';
    // 새 번역 유형 레이블 추가
    case TranslationType.NewFormat:
      return '새 포맷 번역';
    default:
      // never 타입을 사용하여 컴파일 타임에 모든 케이스를 처리했는지 확인
      const _exhaustiveCheck: never = type;
      throw new Error(`Invalid translation type: ${_exhaustiveCheck}`);
  }
};
```

## 사용자 정의 옵션 (선택 사항)

대부분의 경우 `BaseParseOptions` 컴포넌트를 통해 자동으로 생성되는 옵션 UI로 충분합니다. 그러나 복잡한 옵션 UI가 필요한 경우 `DynamicOptions`가 제공하는 옵션 타입(`SHORT_STRING`, `LONG_STRING`, `NUMBER`, `BOOLEAN`)보다 더 많은 커스터마이징이 필요할 수 있습니다.

이 경우 `BaseParseOptions`를 대체하는 커스텀 옵션 컴포넌트를 직접 구현하고, `ParseOptionsFactory` 대신 이 컴포넌트를 사용하도록 설정할 수 있습니다:

```typescript
// src/react/components/options/CustomNewFormatOptions.tsx
import React, { useCallback, useState, useEffect, memo } from 'react';
import { Box, Switch, FormControlLabel, TextField, Select, MenuItem } from '@mui/material';
import { NewFormatParserOptionsDto } from '@/nest/parser/dto/options/new-format-parser-options.dto';
import { ConfigStore } from '../../config/config-store';
import { CustomOptionComponentProps } from '../../types/translation-types';

// 커스텀 옵션 컴포넌트 props 타입
interface CustomNewFormatOptionsProps extends CustomOptionComponentProps<NewFormatParserOptionsDto> {}

// 커스텀 옵션 컴포넌트 구현 
const CustomNewFormatOptionsBase: React.FC<CustomNewFormatOptionsProps> = ({
  isTranslating,
  onOptionsChange,
  initialOptions,
}) => {
  const configStore = ConfigStore.getInstance();
  const sourceLanguage = configStore.getConfig().sourceLanguage;
  
  // 옵션 상태 관리
  const [options, setOptions] = useState<NewFormatParserOptionsDto>(
    initialOptions || {
      sourceLanguage,
      isFile: false,
      someOption: '',
      anotherOption: false,
      // 추가 옵션들
    }
  );

  // 옵션 변경 시 상위 컴포넌트에 알림
  useEffect(() => {
    if (onOptionsChange) {
      onOptionsChange(options);
    }
  }, [options, onOptionsChange]);

  // 옵션 변경 핸들러
  const handleOptionChange = useCallback(
    (key: keyof NewFormatParserOptionsDto, value: any) => {
      setOptions((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  // 파일 모드 토글 핸들러
  const handleFileInputToggle = useCallback(
    (checked: boolean) => {
      handleOptionChange('isFile', checked);
    },
    [handleOptionChange]
  );

  return (
    <Box sx={{ mb: 2 }}>
      {/* 파일 입력 모드 토글 */}
      <FormControlLabel
        control={
          <Switch
            checked={options.isFile || false}
            onChange={(e) => handleFileInputToggle(e.target.checked)}
            disabled={isTranslating}
          />
        }
        label="파일 모드"
      />
      
      {/* 추가 옵션 UI 구현 */}
      <TextField
        label="추가 옵션"
        fullWidth
        value={options.someOption || ''}
        onChange={(e) => handleOptionChange('someOption', e.target.value)}
        disabled={isTranslating}
        size="small"
        margin="dense"
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={options.anotherOption || false}
            onChange={(e) => handleOptionChange('anotherOption', e.target.checked)}
            disabled={isTranslating}
          />
        }
        label="다른 옵션"
      />
    </Box>
  );
};

// memo로 감싸서 내보내기 (성능 최적화)
export const CustomNewFormatOptions = memo(CustomNewFormatOptionsBase);
```

그런 다음 커스텀 옵션 컴포넌트를 등록하는 방식을 수정합니다:

```typescript
// 커스텀 컴포넌트 import
import { CustomNewFormatOptions } from '../components/options/CustomNewFormatOptions';

function registerNewFormatTranslator(): void {
  // 번역기 설정 (위와 동일)
  const newFormatTranslatorConfig: TranslatorConfig = {
    // ... 기존 설정
  };

  // 커스텀 옵션 컴포넌트 등록
  const OptionComponent: OptionComponentType<TranslationType.NewFormat> = 
    (props) => <CustomNewFormatOptions {...props} />;
  
  // 번역기 등록
  TranslatorFactory.registerTranslator(TranslationType.NewFormat, newFormatTranslatorConfig);
  
  // 커스텀 옵션 컴포넌트 직접 등록 (ParseOptionsFactory.registerParseOptions 대신)
  ParseOptionsRegistry.getInstance().register(TranslationType.NewFormat, {
    label: '새 포맷 파싱 옵션',
    // customComponent 필드 추가 (선택사항)
    customComponent: OptionComponent
  });
}
```

## 커스텀 번역기 동작 (선택 사항)

대부분의 경우 `BaseTranslator` 컴포넌트를 통해 자동으로 생성되는 번역기 UI로 충분합니다. 그러나 추가적인 커스터마이징이 필요한 경우, 완전히 새로운 번역기 컴포넌트를 구현하고 등록할 수 있습니다.

```typescript
// src/react/components/translators/CustomNewFormatTranslator.tsx
import React, { useState, useCallback, memo } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { IpcChannel } from '@/nest/common/ipc.channel';
import { useTranslation } from '../../contexts/TranslationContext';
import { NewFormatParserOptionsDto } from '@/nest/parser/dto/options/new-format-parser-options.dto';
import { CustomTranslatorProps } from './BaseTranslator';

// 커스텀 번역기 컴포넌트 props 타입
interface CustomNewFormatTranslatorProps extends CustomTranslatorProps<NewFormatParserOptionsDto> {}

// 커스텀 번역기 컴포넌트 구현
const CustomNewFormatTranslatorBase: React.FC<CustomNewFormatTranslatorProps> = ({
  parserOptions
}) => {
  const [input, setInput] = useState('');
  const { isTranslating, setIsTranslating, showSnackbar } = useTranslation();

  // 번역 처리 핸들러
  const handleTranslate = useCallback(async () => {
    if (isTranslating || !input.trim()) return;

    try {
      setIsTranslating(true);
      
      // 커스텀 파싱 로직
      const parseResult = await window.electron.ipcRenderer.invoke(
        IpcChannel.ParseNewFormat,
        {
          content: input,
          options: parserOptions
        }
      );

      if (!parseResult.success) {
        throw new Error(parseResult.message || '파싱 실패');
      }

      // 커스텀 번역 로직
      // ...

      // 성공 처리
      showSnackbar('번역이 완료되었습니다!');
    } catch (error) {
      showSnackbar(`오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsTranslating(false);
    }
  }, [input, isTranslating, parserOptions, setIsTranslating, showSnackbar]);

  return (
    <Box>
      <TextField
        fullWidth
        multiline
        rows={10}
        label="새 포맷 입력"
        placeholder="번역할 텍스트를 입력하세요..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isTranslating}
        margin="normal"
      />
      
      <Button
        fullWidth
        variant="contained"
        onClick={handleTranslate}
        disabled={isTranslating || !input.trim()}
      >
        {isTranslating ? '번역 중...' : '번역'}
      </Button>
    </Box>
  );
};

// memo로 감싸서 내보내기 (성능 최적화)
export const CustomNewFormatTranslator = memo(CustomNewFormatTranslatorBase);
```

그런 다음 이 커스텀 번역기를 등록합니다:

```typescript
function registerNewFormatTranslator(): void {
  // ...기존 설정

  // 커스텀 번역기 등록
  const TranslatorComponent: TranslatorComponentType<TranslationType.NewFormat> = 
    (props) => <CustomNewFormatTranslator {...props} />;
  
  // TranslatorRegistry에 직접 등록
  TranslatorRegistry.getInstance().register(TranslationType.NewFormat, {
    options: newFormatTranslatorConfig.options,
    // customComponent 필드 추가 (선택사항)
    customComponent: TranslatorComponent
  });
  
  // ParseOptionsFactory는 기존대로 사용
  ParseOptionsFactory.registerParseOptions(TranslationType.NewFormat, newFormatParseOptionsConfig);
}
```

## 주의사항

1. **유형 안전성**: 항상 타입스크립트 타입을 올바르게 사용하여 유형 안전성을 유지하세요.
2. **레지스트리 패턴**: 프로젝트는 싱글톤 레지스트리 패턴을 사용하여 번역기와 옵션 컴포넌트를 관리합니다. 기존 패턴을 따라 구현하세요.
3. **초기화 타이밍**: 모든 번역기는 앱 시작 시 한 번만 등록됩니다(`registerAllTranslators` 함수를 통해). 동적으로 번역기를 추가하거나 제거할 수 없습니다.
4. **옵션 저장**: 사용자가 설정한 옵션은 자동으로 로컬 스토리지에 저장되므로, 페이지를 새로고침해도 유지됩니다.
5. **채널 설정**: IPC 채널은 `adding-parser.md`에 설명된 대로 미리 백엔드에 구현되어 있어야 합니다.
6. **성능 최적화**: 커스텀 컴포넌트를 만들 때는 `React.memo`를 사용하여 불필요한 리렌더링을 방지하는 것이 좋습니다. 기본 번역기 컴포넌트는 이미 최적화되어 있습니다. 