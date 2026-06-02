# Local vLLM Server Guide (Qwen3-4B-Instruct-2507)

## Overview

This document summarizes the minimum setup required to run a vLLM server as an **OpenAI-compatible translator** for Formatted Docs AI Translator. The baseline model is `Qwen/Qwen3-4B-Instruct-2507`.

## Requirements

- NVIDIA GPU with CUDA drivers
- Python 3.10 or newer
- Enough disk space to download the model
- A recent vLLM version so structured output support is available

## Install vLLM

```bash
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install vllm
```

If installation fails because of CUDA or driver issues, start with the official vLLM documentation.

## Start the Server

```bash
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen3-4B-Instruct-2507 \
  --host 0.0.0.0 \
  --port 8001 \
  --max-model-len 8192 \
  --gpu-memory-utilization 0.9
```

- Tune `--max-model-len` and `--gpu-memory-utilization` based on available VRAM.
- If authentication is required, enable the matching vLLM API key option and use the same key in the client.

## Verify the Server

```bash
curl http://localhost:8001/v1/models
```

If the server returns JSON, it is running correctly.

## Connect the App (OpenAI-compatible mode)

Use the following values in the app settings screen:

- **Provider**: `OpenAI-compatible`
- **Base URL**: `http://localhost:8001/v1`
- **API Key**: the configured key if auth is enabled; otherwise any placeholder string
- **Model Name**: `Qwen/Qwen3-4B-Instruct-2507`
- **Max Concurrent Requests**: tune this to match the server and VRAM limits

Store the configuration as a model preset if you want to reuse it quickly.

## JSON Response Notes

The app uses `response_format: json_schema` to force **structured JSON**. Support may differ across vLLM versions, so after upgrades it is worth validating with a request like this:

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
