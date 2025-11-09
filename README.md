# Formatted Docs AI Translator

AI를 이용한 문서 번역 도구입니다.

## 주요 기능

-   다양한 파일 형식 지원: 텍스트, JSON, CSV, SRT(자막), 이미지 등
-   일괄 번역: 여러 파일을 동시에 번역
-   사용자 정의: 번역 설정을 사용자가 직접 제어

## 개발

자세한 개발자 문서는 다음을 참고하세요.
- **[한글](./docs/ko/index.md)**

### 로컬 실행

-   `yarn dev`: 전체 워크스페이스를 빌드한 뒤 Electron 앱을 실행합니다.
-   `yarn dev:watch`: 변경 사항을 감지하며 개발하려면 이 스크립트를 사용하세요.

### 데이터베이스 (Prisma)

-   Prisma 스키마는 `prisma/schema.prisma`에 정의되어 있습니다.
-   DB 스키마 변경 시: `yarn exec prisma db pull`
-   Prisma Client 타입 재생성: `yarn exec prisma generate`
-   Prisma Studio 실행: `yarn prisma:studio`
