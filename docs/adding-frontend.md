# 프론트엔드 구현 가이드 (설정 기반)

이 문서는 새로운 파서를 추가한 후, 해당 파서를 프론트엔드에서 사용할 수 있도록 설정하는 방법을 설명합니다. 리팩토링을 통해 대부분의 로직이 설정 파일로 중앙화되었습니다.

## 개요

프로젝트는 **설정 중심(Configuration-driven)** 아키텍처를 채택하여, 새로운 번역 유형을 추가하는 데 필요한 대부분의 프론트엔드 로직을 단일 설정 파일에서 관리합니다.

## 새로운 번역 유형 추가 절차

새로운 번역 유형(예: `YAML`)을 프론트엔드에 추가하는 과정은 다음과 같습니다.

> **전제 조건:** 백엔드 파서는 `docs/adding-parser.md` 가이드에 따라 이미 구현되어 있어야 합니다. (IPC 채널, DTO, 파서 서비스 등)

### 1. 번역 유형 Enum 추가

`src/react/contexts/TranslationContext.tsx` 파일을 열고, `TranslationType` enum에 새로운 번역 유형을 추가합니다.

**예시: [`src/react/contexts/TranslationContext.tsx`](src/react/contexts/TranslationContext.tsx:0)**

```typescript
export enum TranslationType {
  Text = 'text',
  Json = 'json',
  Csv = 'csv',
  Subtitle = 'subtitle',
  Yaml = 'yaml', // 새로운 번역 유형 추가
}
```

### 2. 번역 설정 파일 생성

`src/react/config/translation-configs/` 디렉토리에 새로운 번역 유형에 대한 설정 파일을 생성합니다. 파일명은 `[유형].config.ts` 형식(예: `yaml.config.ts`)을 따릅니다.

파일 내용은 `TranslationConfigDefinition` 인터페이스에 따라 작성합니다.

**예시: `src/react/config/translation-configs/yaml.config.ts`**

```typescript
import { TranslationConfigDefinition } from '../../types/translation-config-types';
import { IpcChannel } from 'src/nest/common/ipc.channel';
import { TranslationType } from '../../contexts/TranslationContext';
import { YamlParserOptionsDto } from 'src/nest/parser/dto/options/yaml-parser-options.dto';

export const yamlConfig: TranslationConfigDefinition<YamlParserOptionsDto> = {
  type: TranslationType.Yaml, // Enum 값을 사용
  label: 'YAML 번역',
  translator: {
    inputLabel: 'YAML 입력:',
    inputPlaceholder: '번역할 YAML 데이터를 입력하세요.',
    fileExtension: '.yaml,.yml',
    fileLabel: 'YAML 파일',
    ipc: {
      parse: IpcChannel.ParseYaml,
      apply: IpcChannel.ApplyTranslationToYaml,
    },
  },
  parser: {
    options: {
      label: 'YAML 파싱 옵션',
      optionItems: [],
    },
    dto: YamlParserOptionsDto,
  },
};
```

### 3. 설정 파일 등록

`src/react/config/translation-configs/index.ts` 파일을 열고, 방금 생성한 설정 객체를 `translationConfigs` 배열에 추가합니다.

**예시: `src/react/config/translation-configs/index.ts`**

```typescript
// ... 다른 import
import { yamlConfig } from './yaml.config'; // 1. import 추가

// 2. 배열에 추가
export const translationConfigs = [/*...,*/ yamlConfig];
```

### 완료

위 세 단계를 통해 프론트엔드에 새로운 번역 유형이 완전히 통합됩니다.