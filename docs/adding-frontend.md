# 프론트엔드 구현 가이드 (설정 기반)

이 문서는 새로운 파서를 추가한 후, 해당 파서를 프론트엔드에서 사용할 수 있도록 설정하는 방법을 설명합니다. 리팩토링을 통해 이 과정은 매우 간단해졌습니다.

## 개요

프로젝트는 **설정 중심(Configuration-driven)** 아키텍처를 채택하여, 새로운 번역 유형을 추가하는 데 필요한 모든 프론트엔드 로직을 단일 설정 파일에서 관리합니다. 개발자는 더 이상 여러 파일을 수동으로 수정할 필요가 없습니다.

## 새로운 번역 유형 추가 절차

새로운 번역 유형(예: `YAML`)을 프론트엔드에 추가하는 과정은 다음과 같습니다.

> **전제 조건:** 백엔드 파서는 `docs/adding-parser.md` 가이드에 따라 이미 구현되어 있어야 합니다. (IPC 채널, DTO, 파서 서비스 등)

### 1. 번역 설정 파일 생성

`src/react/config/translation-configs/` 디렉토리에 새로운 번역 유형에 대한 설정 파일을 생성합니다. 파일명은 `[유형].config.ts` 형식(예: `yaml.config.ts`)을 따릅니다.

파일 내용은 `TranslationConfigDefinition` 인터페이스에 따라 작성합니다.

**예시: `src/react/config/translation-configs/yaml.config.ts`**

```typescript
import { TranslationConfigDefinition } from '../../types/translation-config-types';
import { IpcChannel } from 'src/nest/common/ipc.channel';
import { YamlParserOptionsDto } from 'src/nest/parser/dto/options/yaml-parser-options.dto'; // DTO는 미리 생성되어 있어야 함

export const yamlConfig: TranslationConfigDefinition<YamlParserOptionsDto> = {
  // 1. 고유한 타입 이름 (소문자)
  type: 'yaml',

  // 2. UI에 표시될 레이블
  label: 'YAML 번역',

  // 3. 번역기 UI 관련 설정
  translator: {
    inputLabel: 'YAML 입력:',
    inputPlaceholder: '번역할 YAML 데이터를 입력하세요.',
    fileExtension: '.yaml,.yml',
    fileLabel: 'YAML 파일',
    ipc: {
      parse: IpcChannel.ParseYaml, // 백엔드와 약속된 파싱 채널
      apply: IpcChannel.ApplyTranslationToYaml, // 백엔드와 약속된 적용 채널
    },
  },

  // 4. 파서 옵션 UI 관련 설정
  parser: {
    options: {
      label: 'YAML 파싱 옵션',
      // 필요한 경우 옵션 항목 추가
      optionItems: [
        {
          key: 'preserveQuotes',
          label: '따옴표 유지',
          type: 'BOOLEAN',
          description: '문자열의 따옴표를 유지합니다.',
        },
      ],
    },
    // 파서 옵션 DTO 클래스 연결
    dto: YamlParserOptionsDto,
  },

  // 5. (선택 사항) 커스텀 컴포넌트
  // customTranslatorComponent: CustomYamlTranslator,
  // customOptionsComponent: CustomYamlOptions,
};
```

### 2. 설정 파일 등록

`src/react/config/translation-configs/index.ts` 파일을 열고, 방금 생성한 설정 객체를 `translationConfigs` 배열에 추가합니다.

**예시: `src/react/config/translation-configs/index.ts`**

```typescript
import { jsonConfig } from './json.config';
import { csvConfig } from './csv.config';
import { textConfig } from './text.config';
import { yamlConfig } from './yaml.config'; // 1. import 추가

// 2. 배열에 추가
export const translationConfigs = [jsonConfig, csvConfig, textConfig, yamlConfig];
```

### 완료

위 두 단계만으로 프론트엔드에 새로운 번역 유형이 완전히 통합됩니다. 애플리케이션을 다시 시작하면 새로운 번역 유형이 UI에 자동으로 나타나고 모든 기능이 정상적으로 동작합니다. 더 이상 `Context`, `Factory`, `Mapping` 등 여러 파일을 수정할 필요가 없습니다.