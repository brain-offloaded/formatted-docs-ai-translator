# Codex 설정 가이드

이 문서는 이 저장소에서 Codex 설정을 어디에 두고, 무엇을 문서화하며, 무엇을 레포에 커밋하지 않을지를 정리합니다.

## 왜 `.codex`와 `AGENTS.md`를 같이 쓰는가

OpenAI Codex 공식 문서 기준으로 역할이 다릅니다.

- `AGENTS.md`: 저장소 규칙, 검증 순서, 리뷰 기대치처럼 항상 따라야 하는 팀 규칙을 둡니다.
- `.codex/config.toml`: 샌드박스와 승인 정책처럼 프로젝트 단위 실행 기본값을 둡니다.
- `hooks`: 사람이 반복해서 놓치는 동작을 기계적으로 강제해야 할 때만 둡니다.

이 저장소는 이미 루트 `AGENTS.md`에 구조, 빌드, 커밋 규칙이 잘 정리되어 있으므로, `.codex/config.toml`에는 실행 정책만 최소한으로 둡니다.

## 현재 채택한 레포 로컬 설정

`.codex/config.toml`

```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = false
```

선택 이유는 다음과 같습니다.

- `on-request`: 브랜치 생성, 커밋, 푸시, 패키징, GUI 실행처럼 실제로 승인 가치가 있는 작업만 멈추게 합니다.
- `workspace-write`: 코드와 문서는 바로 수정할 수 있지만, 저장소 밖이나 보호된 경로 접근은 기본적으로 막습니다.
- `network_access = false`: 이 레포의 기본 검증은 `yarn lint`, `yarn test`, `yarn build`로 충분합니다. GitHub 조작, 외부 다운로드, 임의 네트워크 호출은 기본값으로 열어두지 않고 필요할 때만 승인 흐름을 탑니다.

## 이 저장소에서 Codex가 따라야 하는 운영 규칙

운영 규칙은 `AGENTS.md`에 둡니다.

- 기본 검증 순서는 `yarn lint` → `yarn test` → `yarn build`
- `yarn dev`, `yarn dev:watch`, Electron 직접 실행은 GUI 확인이 필요한 작업에서만 사용
- 로컬 실행 기준 Node는 `package.json`의 `volta.node`인 `22.14.0`
- `translation-cache.db`는 데이터 흐름 작업이 아닌 이상 생성, 삭제, 초기화하지 않음
- Prisma 스키마 관련 작업 뒤에는 `yarn exec prisma db pull`, `yarn exec prisma generate` 여부를 명시적으로 판단

이 저장소는 Electron, Prisma, 네이티브 모듈이 함께 있으므로, Codex가 "실행 가능한 명령이 보인다"는 이유만으로 GUI나 DB 쪽 작업까지 자동으로 넓히지 않도록 하는 것이 중요합니다.

## 아직 레포에 넣지 않은 설정

다음 항목은 공식 문서 기준으로 전역 사용자 설정 또는 더 강한 자동화에 가깝기 때문에 현재는 레포에 커밋하지 않습니다.

- 모델 선택, reasoning effort, provider, auth 관련 설정
- OpenAI base URL, 토큰, MCP 자격 증명
- 개인 알림, 텔레메트리, UI/TUI 선호 설정
- repo-local hook 스크립트

특히 hooks는 신뢰 검토가 필요하고 팀 전체에 추가 마찰을 만들 수 있으므로, 아래처럼 반복 위반이 확인될 때만 도입하는 편이 낫습니다.

- `yarn dev`를 불필요하게 자주 실행하는 실수가 반복될 때
- DB 파일이나 Prisma 산출물을 실수로 건드리는 경우가 반복될 때
- 항상 같은 검증 누락이 PR 리뷰에서 반복될 때

## 나중에 확장할 때의 기준

1. 저장소 규칙을 더 명확히 하고 싶으면 `AGENTS.md`를 먼저 고칩니다.
2. 프로젝트 전체 실행 기본값을 바꾸고 싶으면 `.codex/config.toml`을 조정합니다.
3. 반복 실수를 기계적으로 막아야 할 때만 `.codex/hooks.json` 또는 hook 스크립트를 추가합니다.
4. 반복 가능한 레포 전용 워크플로가 생기면 `.agents/skills`에 skill을 추가합니다.

## 참고한 공식 문서

- Codex manual: Configuration, Authentication, and Models > Project config files (`.codex/config.toml`)
- Codex manual: Custom instructions with `AGENTS.md`
- Codex manual: Customization
- Codex manual: Hooks
