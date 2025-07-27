# 프론트엔드 아키텍처 설계 문서

## 1. 개요

본 문서는 탭 기반 UI를 가진 기존 애플리케이션을 기능별 독립 뷰(View) 구조로 개편하기 위한 프론트엔드 아키텍처를 제안합니다. 이 아키텍처의 목표는 코드의 모듈성, 재사용성, 유지보수성을 향상시키는 것입니다.

## 2. 새로운 아키텍처 및 디렉토리 구조

기존의 패널 중심 구조에서 벗어나, 각 핵심 기능을 독립적인 뷰로 분리합니다. 이를 위해 다음과 같은 디렉토리 구조를 제안합니다.

```
src/react/
├── components/      # 공통 재사용 컴포넌트
├── contexts/        # 전역 상태 관리 (React Context)
├── hooks/           # 공통 커스텀 훅
├── layouts/         # 애플리케이션 레이아웃
├── views/           # 기능별 뷰 컴포넌트
│   ├── SettingsView/
│   │   ├── index.tsx
│   │   └── components/
│   ├── PresetsView/
│   │   ├── index.tsx
│   │   └── components/
│   └── TranslationView/
│       ├── index.tsx
│       └── components/
└── App.tsx          # 라우팅 및 최상위 렌더링
```

## 3. 컴포넌트 계층 구조

각 뷰는 다음과 같은 컴포넌트 계층 구조를 가집니다.

### 3.1. SettingsView (AI 및 모델 설정)

- **SettingsView**: 뷰 컨테이너
  - **AIProviderSelector**: AI 서비스 제공자 선택
  - **ModelSettingsPanel**: 모델 상세 파라미터 설정
  - **APIKeyManager**: API 키 관리
  - **SaveSettingsButton**: 설정 저장

### 3.2. PresetsView (예제/프롬프트 프리셋 설정)

- **PresetsView**: 뷰 컨테이너
  - **PresetTypeTabs**: '예제'와 '프롬프트' 프리셋 간 전환 탭
  - **PresetList**: 프리셋 목록 표시
    - **PresetListItem**: 개별 프리셋 항목
  - **PresetEditorModal**: 프리셋 생성 및 수정 모달

### 3.3. TranslationView (번역 실행)

- **TranslationView**: 뷰 컨테이너
  - **InputPanel**: 원본 콘텐츠 입력 영역 (파일 업로드, 텍스트 에디터)
  - **ActionToolbar**: 프리셋 선택 및 번역 실행 버튼 포함
  - **OutputPanel**: 번역 진행 상태 및 결과 표시

## 4. 상태 관리 전략

뷰 간의 데이터 공유 및 상태 동기화를 위해 다음과 같은 전략을 사용합니다.

- **전역 상태 (Global State)**: 여러 뷰에서 공유되는 상태는 React Context API를 사용하여 관리합니다.
  - `SettingsContext`: AI 모델 설정 (API 키, 파라미터 등)
  - `PresetContext`: 예제/프롬프트 프리셋 목록
  - `AppContext`: 전역 UI 상태 (활성 뷰, 로딩 상태 등)

- **뷰 내부 상태 (View-specific State)**: 특정 뷰 내에서만 사용되는 상태는 `useState`, `useReducer`를 통해 관리합니다.

- **데이터 흐름**: 단방향 데이터 흐름을 원칙으로 하여, 사용자 인터랙션이 Context 상태를 변경하고, 변경된 상태가 UI에 반영되도록 합니다.

## 5. 공통 컴포넌트

여러 뷰에서 재사용되는 컴포넌트는 `src/react/components/` 디렉토리에서 관리하여 코드 중복을 방지하고 일관성을 유지합니다.

- **UI Elements**: `Button`, `Modal`, `DataTable`, `FormField`, `FileUploader`, `CopyButton`, `Tabs`
- **Translation Specific**: `TranslationButton`, `TranslationProgress`, `TranslationResult`, `TranslationError`, `TranslationSuccess`