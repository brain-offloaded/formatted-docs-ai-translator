# 릴리스 프로세스 가이드

이 문서는 Formatted Docs AI Translator의 GitHub Flow 기반 릴리스 방법을 설명합니다.

## 브랜치 전략

프로젝트는 다음 전략을 사용합니다:

- `main`: 배포 가능한 기본 브랜치
- `feature/*`, `fix/*` 등: 작업용 단기 브랜치

릴리스 전용 장기 브랜치(`develop`, `release/*`)는 사용하지 않습니다.

## 릴리스 절차

### 1. 릴리스 변경사항 준비 및 `main` 반영

`main`에서 작업 브랜치를 만들고 버전/변경 로그를 업데이트한 뒤 PR로 `main`에 병합합니다.

```bash
# main 최신화
git checkout main
git pull origin main

# 작업 브랜치 생성
git checkout -b chore/release-v1.2.3

# 버전 갱신 (예: 1.2.3)
yarn version:set 1.2.3

# CHANGELOG.md 갱신 후 커밋
git add package.json CHANGELOG.md
git commit -m "chore: release v1.2.3"
git push origin chore/release-v1.2.3
```

PR 생성 후 CI가 통과하면 `main`으로 병합합니다.

### 2. 릴리스 태그 발행

태그는 `main`의 릴리스 커밋 기준으로 수동 발행합니다.

```bash
git checkout main
git pull origin main

# 이미 존재하는 태그인지 확인
git tag -l "v1.2.3"

# 태그 생성 및 푸시
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

### 3. GitHub Actions 수동 실행

1. GitHub 저장소의 **Actions** 탭으로 이동
2. **Package (Windows ZIP)** 워크플로우 선택
3. **Run workflow** 클릭
4. `release_tag` 입력값에 `v1.2.3` 입력 후 실행

워크플로우 동작:

- 입력한 태그 형식 검증 (`vX.Y.Z`)
- 원격 태그 존재 확인
- 태그 커밋 기준으로 Windows ZIP 빌드
- 동일 태그의 GitHub Release가 없으면 Draft Release 자동 생성
- 산출물을 Release assets에 업로드 (`--clobber`)

### 4. Draft 릴리스 검수 및 Publish

1. 저장소의 **Releases** 이동
2. Draft 상태의 `v1.2.3` 릴리스 확인
3. 릴리스 노트/첨부 파일 검수
4. **Publish release** 실행

## 재실행 가이드

- 동일 태그로 워크플로우를 다시 실행해도 assets는 `--clobber`로 덮어씁니다.
- 태그가 없으면 워크플로우는 실패합니다. 먼저 `git push origin vX.Y.Z`를 수행하세요.

## 버전 관리 규칙

프로젝트는 [Semantic Versioning](https://semver.org/) 형식을 따릅니다:

- **주 버전(Major)**: 호환되지 않는 API 변경
- **부 버전(Minor)**: 이전 버전과 호환되는 새로운 기능 추가
- **패치 버전(Patch)**: 이전 버전과 호환되는 버그 수정
