# Formatted Docs AI Translator

AI를 이용한 형식 보존 문서 번역 도구입니다.

영문 메인 문서는 [README.md](./README.md)에서 확인할 수 있습니다.

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](./LICENSE)를 참고하세요.

---

### 작성자의 말

#### 1. 소박한 바람

이 도구가 도움이 되셨다면 출처를 남기거나 주변에 알려주시면 감사하겠습니다. 물론 **필수는 아니며**, 개인적인 바람일 뿐입니다. 출처 표기 없이 사용하셔도 충분히 감사합니다.

#### 2. 완전한 자유

형식적으로는 MIT 라이선스를 적용했지만, 실제로는 라이선스 조항을 엄격하게 집행할 생각이 거의 없습니다.
제 이름을 지우거나, 심지어 본인이 만들었다고 주장하셔도 괜찮습니다.

**단 한 가지 부탁만 있습니다.** 본인이 만들었다고 주장한 뒤 오히려 원작자인 저에게 저작권 침해를 주장하는 일만 아니라면, 자유롭게 사용하셔도 됩니다.

## 주요 기능

- 텍스트, JSON, CSV, SRT, 이미지 등 다양한 형식 지원
- 여러 파일을 한 번에 처리하는 일괄 번역
- 번역 설정과 워크플로를 사용자가 직접 제어 가능

## 개발 문서

- **[영문 문서](./docs/en/index.md)**
- **[한글 문서](./docs/ko/index.md)**

### Codex 유지보수 워크플로

이 저장소는 Codex를 단순 코드 생성기가 아니라 OSS 유지보수 보조 에이전트로 사용합니다.

- 저장소 규칙은 `AGENTS.md`에 둡니다.
- 프로젝트 로컬 Codex 기본값은 `.codex/config.toml`에 둡니다.
- 반복 가능한 유지보수 절차는 `.agents/skills/oss-maintainer-codex`에 둡니다.

주요 사용 사례는 다음과 같습니다.

- PR 설명과 검증 절차 정리
- 개발자 문서와 Codex 운영 규칙 동기화
- 릴리스 전 `yarn lint` / `yarn test` / `yarn build` 검증
- Electron, Prisma, 번역 캐시를 건드리는 변경의 범위 축소

### 로컬 개발

- `yarn dev`: 전체 워크스페이스를 빌드한 뒤 Electron 앱을 실행합니다.
- `yarn dev:watch`: 개발 중 변경 사항을 감지하며 다시 빌드합니다.

### 데이터베이스 (Prisma)

- Prisma 스키마: `prisma/schema.prisma`
- DB 스키마 동기화: `yarn exec prisma db pull`
- Prisma Client 재생성: `yarn exec prisma generate`
- Prisma Studio 실행: `yarn prisma:studio`
