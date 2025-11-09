# 릴리스 프로세스 가이드

이 문서는 Formatted Docs AI Translator의 새 버전을 릴리스하는 방법을 설명합니다.

## 릴리스 브랜치 전략

프로젝트는 다음과 같은 브랜치 전략을 사용합니다:
- `develop`: 개발 브랜치
- `main`: 프로덕션 릴리스 브랜치
- `release/vX.Y.Z`: 릴리스 준비 브랜치

## 릴리스 절차

### 1. 릴리스 브랜치 생성

먼저 `develop` 브랜치에서 릴리스 브랜치를 생성합니다:

```bash
# develop 브랜치 최신 상태로 업데이트
git checkout develop
git pull origin develop

# 릴리스 브랜치 생성 (예: v1.2.3)
git checkout -b release/v1.2.3
```

### 2. 버전 번호 및 변경 로그 업데이트

`package.json` 파일의 버전 번호를 업데이트하고, `CHANGELOG.md`를 최신화합니다.

```bash
# yarn을 사용하여 버전 업데이트 (package.json과 git tag 동시 생성)
yarn version --new-version 1.2.3
```

`CHANGELOG.md` 파일에 이번 릴리스의 주요 변경 사항을 수동으로 기록합니다.

그런 다음 변경 사항을 커밋합니다.

```bash
# 변경사항 커밋
git add package.json CHANGELOG.md
git commit -m "chore: release v1.2.3"
```

### 3. 릴리스 브랜치 푸시

릴리스 브랜치를 원격 저장소에 푸시합니다:

```bash
git push origin release/v1.2.3
```

### 4. 빌드 및 테스트

애플리케이션을 빌드하고 정상적으로 작동하는지 테스트합니다:

```bash
# Windows 빌드
yarn package:win

# Linux 빌드
yarn package:linux
```

### 5. 릴리스 브랜치를 main에 병합

릴리스 브랜치를 `main` 브랜치에 병합합니다.

```bash
git checkout main
git pull origin main
git merge --no-ff release/v1.2.3
git push origin main
```

### 6. 릴리스 태그 푸시

`yarn version` 명령으로 생성된 태그를 원격 저장소에 푸시합니다.

```bash
git push origin v1.2.3
```

### 7. GitHub 릴리스 생성

GitHub CLI를 사용하여 릴리스를 생성합니다.

```bash
# 릴리스 생성 (릴리스 노트는 자동으로 생성됩니다)
gh release create v1.2.3 --title "Formatted Docs AI Translator v1.2.3" --generate-notes "release/Formatted Docs AI Translator-1.2.3-win.zip" "release/Formatted Docs AI Translator-1.2.3-linux.zip"
```

또는 GitHub 웹사이트에서 수동으로 릴리스를 생성할 수도 있습니다:
1.  프로젝트의 GitHub 페이지로 이동
2.  "Releases" 섹션으로 이동
3.  "Draft a new release" 버튼 클릭
4.  방금 푸시한 태그 선택 (예: `v1.2.3`)
5.  릴리스 제목 작성 (예: `Formatted Docs AI Translator v1.2.3`)
6.  "Generate release notes" 버튼을 클릭하여 변경 사항 요약
7.  빌드된 ZIP 파일(`release/` 디렉토리) 업로드
8.  "Publish release" 버튼 클릭

### 8. 릴리스 브랜치를 develop에 병합

릴리스 브랜치의 변경사항(`package.json` 버전 업데이트 등)을 `develop` 브랜치에도 반영합니다.

```bash
git checkout develop
git merge --no-ff release/v1.2.3
git push origin develop
```

### 9. 릴리스 브랜치 삭제

릴리스가 완료되었으므로 로컬 및 원격 릴리스 브랜치를 삭제합니다.

```bash
git branch -d release/v1.2.3
git push origin --delete release/v1.2.3
```

## 버전 관리 규칙

프로젝트는 [Semantic Versioning](https://semver.org/) 형식을 따릅니다:

- **주 버전(Major)**: 호환되지 않는 API 변경
- **부 버전(Minor)**: 이전 버전과 호환되는 새로운 기능 추가
- **패치 버전(Patch)**: 이전 버전과 호환되는 버그 수정
