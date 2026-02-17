import { AiTranslatorConfig } from '@/react/types/config';
import { isLanguage } from '@apps/common/dist/language';
import { shouldTranslateString } from '@/react/unified/parser/utils/should-translate-string';
import { TranslationUnit } from '../domain/translation-unit';
import { ITranslator, TranslationProgressCallback } from './i-translator';
import { DEFAULT_CACHE_TAG } from '@apps/common/dist/constants/cache';
import { TranslateTextArrayRequestDto } from '@/react/api/generated/models/TranslateTextArrayRequestDto';
import { buildTranslatorAiSettings } from './build-translator-ai-settings';
import { normalizeLineEndings } from '../parser/utils/normalize-line-endings';
import { OpenAPI } from '@/react/api/generated/core/OpenAPI';

interface StreamProgressEvent {
  type: 'progress';
  completed: number;
  total: number;
}

interface StreamCompleteEvent {
  type: 'complete';
  success: boolean;
  message: string;
  translatedTextPaths: Array<{ text: string; translatedText: string; path: string }>;
}

interface StreamErrorEvent {
  type: 'error';
  success: boolean;
  message: string;
}

type StreamEvent = StreamProgressEvent | StreamCompleteEvent | StreamErrorEvent;

export class TextArrayTranslator implements ITranslator {
  private normalizeText(text: string): string {
    return normalizeLineEndings(text);
  }

  async translate(
    units: TranslationUnit[],
    config: AiTranslatorConfig,
    promptPresetContent?: string,
    sourceFilePath?: string,
    onProgress?: TranslationProgressCallback
  ): Promise<TranslationUnit[]> {
    const requestId = crypto.randomUUID();

    // 1) 줄바꿈 표준화로 정규화
    const normalizedUnits: TranslationUnit[] = units.map(({ key, source, target }) => ({
      key,
      source: this.normalizeText(source),
      target,
    }));

    // 2) 번역 대상 선정
    const translatable = normalizedUnits
      .map((unit, index) => ({ unit, index }))
      .filter(({ unit: { source } }) => {
        const text = source.trim();
        if (!shouldTranslateString(text)) return false;
        return isLanguage(text, config.sourceLanguage);
      });

    // 번역할 항목이 없다면 원본을 그대로 반환
    if (translatable.length === 0) {
      onProgress?.(units.length, units.length);
      return units;
    }

    const placeholderRules = config.placeholderPreservationRules
      .filter(({ pattern, enabled }) => enabled && pattern.trim().length > 0)
      .map(({ pattern, flags, enabled }) => ({
        pattern,
        flags: flags.trim() ? flags.trim() : undefined,
        enabled,
      }));
    const placeholderPreservation =
      config.placeholderPreservationEnabled && placeholderRules.length > 0
        ? {
            enabled: true,
            rules: placeholderRules,
          }
        : undefined;

    const payload: TranslateTextArrayRequestDto = {
      requestId,
      aiSettings: buildTranslatorAiSettings(config),
      promptPresetContent: promptPresetContent ?? '',
      sourceFilePath: sourceFilePath ?? '',
      textPaths: translatable.map(({ unit: { source, key } }) => ({ text: source, path: key })),
      cacheTag: config.cacheTag?.trim() ? config.cacheTag.trim() : DEFAULT_CACHE_TAG,
      placeholderPreservation,
    };

    // 스트리밍 엔드포인트 호출
    const baseUrl = OpenAPI.BASE || '';
    const response = await fetch(`${baseUrl}/translator/text/translate/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Translation request failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is not available');
    }

    // NDJSON 스트림 파싱
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completeEvent: StreamCompleteEvent | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line) as StreamEvent;
          if (event.type === 'progress') {
            onProgress?.(event.completed, event.total);
          } else if (event.type === 'complete') {
            completeEvent = event;
          } else if (event.type === 'error') {
            throw new Error(event.message);
          }
        } catch (parseError) {
          console.warn('[TextArrayTranslator] Failed to parse NDJSON line:', line, parseError);
        }
      }
    }

    // 남은 버퍼 처리
    if (buffer.trim()) {
      try {
        const event = JSON.parse(buffer) as StreamEvent;
        if (event.type === 'complete') {
          completeEvent = event;
        } else if (event.type === 'error') {
          throw new Error(event.message);
        }
      } catch {
        // ignore
      }
    }

    if (!completeEvent) {
      throw new Error('Translation stream ended without complete event');
    }

    if (!completeEvent.success) {
      throw new Error(completeEvent.message);
    }

    // 3) 응답을 원본 인덱스로 매핑
    const result: TranslationUnit[] = units.map((u) => ({ ...u }));
    translatable.forEach(({ index }, i) => {
      const translated = completeEvent!.translatedTextPaths[i]?.translatedText ?? '';
      result[index] = { ...result[index], target: translated };
    });

    return result;
  }
}
