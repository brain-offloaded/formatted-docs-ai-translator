# 외부 번역기 연동용 Parser/Applier 교환 포맷 (베타 최소 스펙)

## 목적과 범위

-   번역 엔진을 분리하기 위한 **최소한의** 교환 형식입니다.
-   외부 번역기는 `source.txt`를 보고 `target.txt`만 생성하면 됩니다.
-   `metadata.json`과 `original_files/`는 **수정하지 않습니다.**

## ZIP 구조

```
.
├── source.txt
├── metadata.json
└── original_files/
    └── (원본 파일 구조 그대로)
```

적용(Apply) 시에는 동일한 ZIP에 `target.txt`만 추가합니다.

```
.
├── source.txt
├── target.txt
├── metadata.json
└── original_files/
```

## metadata.json (v1)

필수 필드만 정의합니다. 외부 번역기는 내용을 해석할 필요가 없습니다.

```json
{
  "formatVersion": 1,
  "parserId": "string",
  "createdAt": "2025-01-01T00:00:00Z",
  "lineCount": 3,
  "files": [
    { "path": "docs/example.txt" }
  ],
  "units": [
    { "key": "docs/example.txt:1", "file": "docs/example.txt", "meta": {} },
    { "key": "docs/example.txt:2", "file": "docs/example.txt", "meta": {} },
    { "key": "docs/example.txt:3", "file": "docs/example.txt", "meta": {} }
  ]
}
```

필드 설명:

-   `formatVersion` – 고정 값 `1`.
-   `parserId` – 어떤 파서/어플라이어로 생성했는지 식별자.
-   `createdAt` – ISO 8601.
-   `lineCount` – `source.txt`의 총 라인 수.
-   `files` – `original_files/`에 들어있는 파일의 상대 경로 목록.
-   `units` – `source.txt`의 **라인 순서와 1:1 대응**하는 배열.
    -   `key`/`file`/`meta`는 어플라이어용이며 외부 번역기는 수정하지 않습니다.

## 라인 정합 정책 (가장 중요)

-   `source.txt`는 UTF-8, LF(`\n`)로 출력합니다. BOM은 사용하지 않습니다.
-   **각 라인이 하나의 번역 단위**입니다. 줄 수가 곧 번역 단위 수입니다.
-   `target.txt`는 **라인 수가 반드시 동일**해야 합니다.
    -   줄을 추가/삭제하면 실패 처리합니다.
    -   빈 줄도 번역 단위로 취급됩니다(그대로 유지).
-   라인 내의 개행은 허용되지 않습니다. 줄 바꿈이 필요한 경우 파서가 이미 처리한 결과로만 전달됩니다.
-   앞뒤 공백/탭 등은 의미가 있을 수 있으므로 가급적 보존합니다.
-   맨 마지막에 개행이 있으면 마지막 줄이 빈 줄로 계산됩니다. `target.txt`에서도 동일하게 맞춥니다.

## 예시

`source.txt`

```
Hello

World!
```

`target.txt`

```
안녕하세요

세계!
```
