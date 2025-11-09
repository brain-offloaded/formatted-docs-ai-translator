# Electron 패키징 최적화 가이드

## 개요

이 프로젝트는 Electron 앱 패키징 시간을 극적으로 단축하기 위해 최적화된 빌드 시스템을 사용합니다.

**성능 개선 결과:**
- 기존: ~2분 20초
- 최적화 후 (첫 실행): 33초 (76% 감소)
- 최적화 후 (캐시 사용): 20초 (86% 감소)

## 명령어

### 개발용 (빠른 패키징)
```bash
yarn package:linux      # Linux용 (20초, zip 없음)
yarn package:win        # Windows용 (zip 없음)
```

### 배포용 (압축 포함)
```bash
yarn package:linux:dist # Linux용 (zip 포함)
yarn package:win:dist   # Windows용 (zip 포함)
```

## 최적화 기법

### 1. 자동 의존성 동기화

**문제:** Yarn workspace 환경에서 electron-builder가 루트 `package.json`의 dependencies만 인식

**해결책:** `apps/backend/package.json`의 dependencies를 자동으로 루트에 동기화
- `scripts/prepare-package-optimized.mjs`가 자동으로 처리
- 더 이상 수동으로 의존성을 복사할 필요 없음

```javascript
// backend/package.json에만 추가하면 됨
{
  "dependencies": {
    "new-package": "^1.0.0"
  }
}
```

### 2. 선택적 node_modules 복사

**최적화:**
- rsync를 사용한 빠른 복사
- dev dependencies 제외 (eslint, prettier, typescript 등)
- 약 600MB → 1.1GB (필요한 것만)

**제외되는 패키지:**
- `.cache`, `.bin`
- `turbo`, `electron`, `electron-builder`
- `eslint*`, `prettier`, `typescript`
- `jest`, `@jest`, `nodemon`, `concurrently`
- `@nestjs/cli`, `@nestjs/testing`
- `webpack*`, `@babel`

### 3. 타임스탬프 기반 캐싱

**작동 방식:**
- staging의 `node_modules`가 루트보다 최신이면 복사 스킵
- 첫 실행: ~20초 (복사 수행)
- 이후 실행: ~3초 (캐시 사용)

**캐시 무효화 시점:**
- `yarn install` 실행 시
- `node_modules`가 변경되었을 때

### 4. 빌드 설정 최적화

```json
{
  "npmRebuild": false,        // npm 설치/rebuild 스킵
  "nodeGypRebuild": false,    // 네이티브 모듈 rebuild 스킵
  "buildDependenciesFromSource": false,
  "asar": {
    "smartUnpack": false      // asar unpack 최적화
  }
}
```

### 5. 개발/배포 분리

**개발용 (`--dir`):**
- zip 압축 스킵 → 30초 단축
- `release/linux-unpacked/` 직접 실행 가능

**배포용 (기본):**
- zip/설치 파일 생성
- CI/CD나 릴리스용

## 디렉터리 구조

```
apps/
  backend/
    app/                    # Staging 디렉터리
      dist/                 # 빌드된 코드
      node_modules/         # 캐시된 production deps
      package.json          # 런타임 package.json
      index.html
release/
  linux-unpacked/           # 패키징된 앱 (개발용)
  formatted-docs-ai-translator-0.1.1.zip  # 배포용
```

## 트러블슈팅

### node_modules 캐시가 문제일 때
```bash
rm -rf apps/backend/app
yarn package:linux
```

### 의존성이 제대로 추가 안 될 때
```bash
# backend package.json 확인
cat apps/backend/package.json | grep "new-package"

# 강제 재동기화
rm -rf apps/backend/app
yarn package:linux
```

### 패키징 실패 시
```bash
# 전체 정리 후 재빌드
yarn clean
rm -rf apps/backend/app release
yarn build
yarn package:linux
```

## CI/CD 권장 설정

```yaml
- name: Package Application
  run: yarn package:linux:dist  # 배포용 (zip 포함)
  
- name: Cache Staging
  uses: actions/cache@v3
  with:
    path: apps/backend/app/node_modules
    key: staging-node-modules-${{ hashFiles('yarn.lock') }}
```

## 추가 최적화 가능성

1. **pnpm 사용:** `nodeLinker: pnpm` → 심볼릭 링크로 디스크 사용량 감소
2. **esbuild 번들링:** 더 작은 `dist/` 크기
3. **native 모듈 사전 빌드:** better-sqlite3 등의 rebuild 시간 제거

## 참고

- Electron Builder 문서: https://www.electron.build/
- Yarn Workspaces: https://yarnpkg.com/features/workspaces
