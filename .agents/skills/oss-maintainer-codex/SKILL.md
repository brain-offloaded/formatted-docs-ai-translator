---
name: oss-maintainer-codex
description: 이 저장소에서 Codex를 OSS 유지보수 워크플로에 맞게 사용해야 할 때 적용한다. PR/이슈 정리, 문서 갱신, 릴리스 전 검증, Codex 운영 규칙 보강 요청이 들어오면 사용한다.
---

# OSS Maintainer Codex

이 스킬은 이 저장소에서 Codex를 "일반 코드 생성기"가 아니라 유지보수 보조 에이전트로 사용할 때의 기본 워크플로를 정의한다.

## 적용 범위

- PR 설명, 검증 절차, 영향 범위를 정리할 때
- 이슈/PR에서 반복되는 유지보수 규칙을 `AGENTS.md`나 `docs/ko/codex.md`에 반영할 때
- 릴리스 전후 점검, 문서 동기화, 개발자 가이드 정리를 할 때
- Electron/Prisma/번역 캐시 특성 때문에 작업 범위를 보수적으로 좁혀야 할 때

## 작업 원칙

1. 먼저 저장소 규칙을 읽는다.
   - 루트 `AGENTS.md`
   - `docs/ko/codex.md`

2. 기본 검증 루프를 유지한다.
   - 코드나 문서를 바꾼 뒤 기본 검증은 `yarn lint`, `yarn test`, `yarn build`
   - GUI 확인이 꼭 필요하지 않으면 `yarn dev`, `yarn dev:watch`, Electron 직접 실행은 피한다

3. 위험한 영역은 자동으로 넓히지 않는다.
   - `translation-cache.db`는 데이터 흐름 작업이 아니면 건드리지 않는다
   - Prisma 스키마 작업은 명시적 필요가 있을 때만 진행한다
   - 네이티브 rebuild나 패키징은 실제 필요가 확인될 때만 수행한다

4. 유지보수 산출물을 남긴다.
   - 반복 규칙은 `AGENTS.md` 또는 `docs/ko/codex.md`에 반영한다
   - PR에는 변경 내용, 배경, 영향, 검증을 한국어로 정리한다
   - 저장소 전용 반복 워크플로가 생기면 `.agents/skills`에 추가하는 쪽을 우선한다

## 출력 기대치

- 단순 수정만 하지 말고, 유지보수자가 다음 세션에 재사용할 수 있는 문서 또는 규칙을 함께 남긴다
- PR 본문에는 최소한 다음을 포함한다
  - 변경 내용
  - 왜 Codex 설정/문서가 필요한지
  - 어떤 maintainer workflow를 지원하는지
  - 어떤 명령으로 검증했는지
