# AI 번역기

AI를 이용한 문서 번역 도구입니다.

## 개발자 가이드

- [새 파서 추가 방법](docs/adding-parser.md) - 새로운 형식의 파서를 추가하는 방법에 대한 가이드
- [프론트엔드 구현 방법](docs/adding-frontend.md) - 새 파서 추가 후 프론트엔드에서 사용할 수 있도록 구현하는 방법
- [릴리스 방법](docs/how-to-release.md) - 새 버전 릴리스 프로세스에 대한 가이드

## 로컬 실행

- `yarn dev`: 전체 워크스페이스를 빌드한 뒤 `dist/main.js` 단일 엔트리를 Electron으로 실행합니다. 패키징 결과와 동일한 구조를 검증하고 싶을 때 사용합니다.
- `yarn dev:watch`: 기존처럼 `turbo watch` + `nodemon`으로 변경 사항을 감지하면서 개발하려면 이 스크립트를 사용하세요.

## 데이터베이스 (Prisma)

- Prisma 스키마는 루트 `prisma/schema.prisma`에 상시 보관합니다. DB 구조가 변경되면 `yarn exec prisma db pull`로 최신 상태를 가져오고, 변경된 타입은 `yarn exec prisma generate`로 반영합니다.
- Prisma Studio는 커스텀 스크립트 없이 `yarn prisma:studio`로 실행합니다. `.env`의 `DATABASE_URL`은 `prisma/` 디렉터리 기준 상대 경로(`file:../translation-cache.db`)를 사용합니다.
- 런타임에서는 `PrismaService`가 `translation-cache.db` 경로를 자동으로 맞춰 주므로, 서비스 코드에서는 Prisma Client만 사용하면 됩니다.

## 개발 프로세스

새로운 파일 형식 지원을 추가하려면 다음 순서로 작업해야 합니다:

### 1. 백엔드 파서 구현
[새 파서 추가 방법](docs/adding-parser.md) 문서에 따라 다음 순서로 진행합니다:
- IPC 채널 추가 (통신 채널 등록)
- DTO 파일 생성 (옵션, 요청, 응답 데이터 구조 정의)
- 파서 서비스 구현 (실제 파싱 로직 작성)
- 모듈 및 핸들러 등록 (의존성 주입 설정)

### 2. 프론트엔드 구현
백엔드 파서 구현이 완료된 후 [프론트엔드 구현 방법](docs/adding-frontend.md) 문서에 따라 다음 작업을 진행합니다:
- 번역 유형 등록 (새 파서 타입 추가)
- 파서 옵션 컴포넌트 생성 (사용자 설정 UI)
- 번역기 컴포넌트 구현 (UI 흐름 구현)
- 타입 매핑 및 유틸리티 업데이트 (연동 설정)

백엔드 파서가 먼저 구현되어야 하는 이유는 프론트엔드가 IPC 채널과 DTO 구조에 의존하기 때문입니다. 백엔드 파서 구현 없이는 프론트엔드에서 해당 기능을 사용할 수 없습니다.
