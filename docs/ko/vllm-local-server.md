# vLLM 로컬 서버 실행 가이드 (Qwen3-4B-Instruct-2507)

## 개요

이 문서는 Formatted Docs AI Translator에서 **OpenAI-compatible 번역기**로 vLLM 서버를 실행하는 최소 절차를 정리합니다. 기준 모델은 `Qwen/Qwen3-4B-Instruct-2507`입니다.

## 준비 사항

-   NVIDIA GPU + CUDA 드라이버
-   Python 3.10 이상
-   모델 다운로드를 위한 디스크 공간
-   최신 vLLM 버전(구조화 출력 지원 확인용)

## vLLM 설치

```bash
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install vllm
```

> 설치가 실패하거나 CUDA/드라이버 이슈가 있으면 vLLM 공식 문서를 먼저 확인하세요.

## 서버 실행

```bash
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen3-4B-Instruct-2507 \
  --host 0.0.0.0 \
  --port 8001 \
  --max-model-len 8192 \
  --gpu-memory-utilization 0.9
```

-   `--max-model-len`, `--gpu-memory-utilization`은 VRAM 상황에 맞춰 조정합니다.
-   인증이 필요하다면 vLLM의 API 키 옵션을 추가하고, 클라이언트에서도 동일한 키를 사용합니다.

## 동작 확인

```bash
curl http://localhost:8001/v1/models
```

JSON 응답이 오면 서버가 정상 동작 중입니다.

## 앱 연결 (OpenAI-compatible)

앱 설정 화면에서 다음 값을 입력합니다.

-   **Provider**: `OpenAI-compatible`
-   **Base URL**: `http://localhost:8001/v1`
-   **API Key**: 서버 인증을 켰다면 해당 키, 그렇지 않다면 임의 문자열
-   **Model Name**: `Qwen/Qwen3-4B-Instruct-2507`
-   **Max Concurrent Requests**: 서버/VRAM 상황에 맞게 조절

모델 프리셋에 저장하면 동일 설정을 빠르게 재사용할 수 있습니다.

## JSON 응답 주의사항

앱은 `response_format: json_schema`를 사용해 **구조화 JSON**을 강제합니다. vLLM 버전에 따라 지원 여부가 다를 수 있으니, 서버 업그레이드 후 아래와 같은 테스트 요청으로 확인하는 것을 권장합니다.

```bash
curl http://localhost:8001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer local" \
  -d '{
    "model": "Qwen/Qwen3-4B-Instruct-2507",
    "messages": [
      { "role": "system", "content": "You are a translator. Return JSON only." },
      { "role": "user", "content": "Translate to Korean: This is a test." }
    ],
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "translation_result",
        "schema": {
          "type": "object",
          "properties": { "text": { "type": "string" } },
          "required": ["text"],
          "additionalProperties": false
        }
      }
    }
  }'
```
