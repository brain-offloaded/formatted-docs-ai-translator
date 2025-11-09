## 언어 메타데이터 가이드

### 개요
- 번역 파이프라인에서 사용하는 언어는 `src/common/language.ts`에서만 정의합니다.
- 동일한 열거형을 Nest와 React가 공유하므로 추가/수정 시 한 곳만 변경하면 됩니다.
- 메타데이터(`languageMetadata`)는 다국어 라벨과 UI 노출 여부(`supportsUI`)만 유지합니다.

### 주요 타입과 상수
| 이름 | 설명 |
| --- | --- |
| `Language` | 앱이 인지하는 전체 언어. `Language.ANY` 포함 |
| `SourceLanguage` | 입력 언어 선택에 사용되는 열거형 (`ANY` 포함) |
| `TargetLanguage` | 번역 대상 언어 선택에 사용되는 열거형 |
| `languageMetadata` | 언어별 메타데이터 배열 (라벨/`supportsUI`) |
| `sourceLanguages`/`targetLanguages` | 열거형 기반의 언어 목록 |
| `uiLanguages` | UI 에서 선택 가능한 언어 (`supportsUI`가 `true`인 항목) |
| `getLanguageLabel`, `getLanguageLabelByCode` | 언어 ID/코드 문자열(예: `ko`, `en`) → 라벨 |

### 언어 추가 절차
1. `Language` 열거형에 새 항목을 추가합니다.
2. `LANGUAGE_DEFINITIONS`에 해당 언어의 라벨과 `supportsUI` 여부를 추가합니다.
3. 필요하다면 문자열 감지 유틸(`isSpanish` 등)을 추가하고 `isLanguage`에 연결합니다.
4. 번역 프리셋·캐시 등 도메인 로직에 영향이 있는지 확인합니다.

### ANY 언어의 역할
- `Language.ANY`는 감지 모드나 고정되지 않은 입력을 처리할 때 사용합니다.
- 타깃/번역 언어 목록에는 포함되지 않으며, 프리셋 저장 시에도 제외됩니다.
- UI에서는 “Any Language / 모든 언어” 라벨로 사용자를 안내합니다.

### 프리셋과 메타데이터
- 예제 프리셋은 `targetLanguages`를 기준으로 n×n 매트릭스를 생성합니다.
- 언어가 추가되면 메타데이터만 갱신해도 UI/백엔드 루프가 자동으로 확장됩니다.
- 프롬프트/설정 화면은 `getLanguageLabel`과 `uiLanguages`를 조합해 표시합니다.

### 주의 사항
- 메타데이터 배열 순서는 드롭다운 기본 순서에 그대로 반영됩니다.
- 새 언어의 라벨을 추가할 때 i18n 리소스(`src/react/locales/*.json`)도 함께 갱신하세요.
