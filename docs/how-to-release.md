# 릴리스 프로세스 가이드

이 문서는 Formatted Docs AI Translator의 새 버전을 릴리스하는 방법을 설명합니다.

## 릴리스 브랜치 전략

프로젝트는 다음과 같은 브랜치 전략을 사용합니다:
- `main`: 개발 브랜치
- `release/x.y.z`: 릴리스 준비 브랜치

## 릴리스 절차

### 1. 릴리스 브랜치 생성

먼저 main 브랜치에서 릴리스 브랜치를 생성합니다:

```bash
# main 브랜치 최신 상태로 업데이트
git checkout main
git pull origin main

# 릴리스 브랜치 생성
git checkout -b release/x.y.z
```

### 2. 버전 번호 업데이트

package.json 파일의 버전 번호를 업데이트합니다:

```bash
# package.json 파일 수정
# "version": "x.y.z" 부분 업데이트

# 변경사항 커밋
git add package.json
git commit -m "버전을 x.y.z로 업데이트"
```

### 3. 릴리스 브랜치 푸시

릴리스 브랜치를 원격 저장소에 푸시합니다:

```bash
git push -u origin release/x.y.z
```

### 4. 빌드 및 테스트

애플리케이션을 빌드하고 테스트합니다:

```bash
# Windows 빌드
npm run package:win

# Linux 빌드
npm run package:linux
```

### 5. 릴리스 태그 생성

릴리스 태그를 생성하고 푸시합니다:

```bash
git tag -a vx.y.z -m "버전 x.y.z 릴리즈"
git push origin vx.y.z
```

### 6. GitHub 릴리스 생성

GitHub CLI를 사용하여 릴리스를 생성합니다:

```bash
gh release create vx.y.z --title "Formatted Docs AI Translator vx.y.z" --notes "릴리스 노트 내용" "./release/Formatted Docs AI Translator-x.y.z-win.zip"
```

또는 GitHub 웹사이트에서 수동으로 릴리스를 생성할 수도 있습니다:
1. 프로젝트의 GitHub 페이지로 이동
2. "Releases" 섹션으로 이동
3. "Draft a new release" 버튼 클릭
4. 태그 선택에서 "vx.y.z" 선택
5. 릴리스 제목과 설명 작성
6. 빌드된 ZIP 파일 업로드
7. "Publish release" 버튼 클릭

### 7. main 브랜치에 병합 (선택 사항)

릴리스 브랜치의 변경사항을 main 브랜치에 병합할 수도 있습니다:

```bash
git checkout main
git merge release/x.y.z
git push origin main
```

## 버전 관리 규칙

프로젝트는 [Semantic Versioning](https://semver.org/) 형식을 따릅니다:

- **주 버전(x)**: 호환되지 않는 API 변경
- **부 버전(y)**: 이전 버전과 호환되는 새로운 기능 추가
- **패치 버전(z)**: 이전 버전과 호환되는 버그 수정
