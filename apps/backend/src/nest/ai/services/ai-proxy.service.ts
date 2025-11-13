import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';
import { AiChatRequest, AiChatResponse, toTextFromMessageContent } from '../dto/common-ai.dto';
import { GoogleAiProviderService } from './providers/google-ai.provider';
import { OpenAiCompatibleProviderService } from './providers/openai-compatible.provider';
import {
  ModelProvider,
  TranslatorAiSettings,
} from '@/nest/translator/common/dto/translator-settings.dto';
import { TranslationResult } from '@/nest/ai/types/translation-result.interface';
import { errorToString } from '@/nest/utils/error-stringify';

export class TranslationParsingError extends Error {
  public readonly shouldReduceBatchSize: boolean;
  public readonly cause?: unknown;

  constructor(
    message: string,
    options?: {
      cause?: unknown;
      shouldReduceBatchSize?: boolean;
    }
  ) {
    super(message);
    this.name = 'TranslationParsingError';
    this.shouldReduceBatchSize = !!options?.shouldReduceBatchSize;
    this.cause = options?.cause;
  }
}

type TranslationSegment = { id: number; translated_text: string };

interface ParsedSegmentResult {
  segments: TranslationSegment[];
  hasPartialData: boolean;
}

@Injectable()
export class AiProxyService {
  constructor(
    private readonly logger: LoggerService,
    private readonly googleProvider: GoogleAiProviderService,
    private readonly openAiProvider: OpenAiCompatibleProviderService
  ) {}

  async chat({
    aiSettings,
    request,
    apiKey,
  }: {
    aiSettings: TranslatorAiSettings;
    request: AiChatRequest;
    apiKey: string;
  }): Promise<AiChatResponse> {
    const { modelProvider: provider } = aiSettings;
    switch (provider) {
      case ModelProvider.GOOGLE:
      case ModelProvider.VERTEX_AI:
        // Both Google AI and Vertex AI are now handled by the unified GoogleAiProviderService
        return this.googleProvider.chat({ aiSettings, request, apiKey });
      default:
        return this.openAiProvider.chat({ aiSettings, request, apiKey });
    }
  }

  // Translation-oriented helpers migrated from AiResponseService
  private getFinishReason(response: AiChatResponse): string {
    const finishReason = response.choices?.[0]?.finishReason;
    if (finishReason === 'content_filter' || !finishReason) {
      this.logger.debug('getFinishReason: OTHER', {
        extra: {
          choices: response.choices,
          usage: response.usage,
          finishReason,
        },
      });
    }
    return finishReason ?? 'CUSTOM_UNKNOWN';
  }

  public isFinishedByMaxTokens(response: AiChatResponse): boolean {
    const finishReason = this.getFinishReason(response);
    return finishReason === 'length';
  }

  private getResponseText(response: AiChatResponse): string {
    return toTextFromMessageContent(response.choices[0].message.content) || '';
  }

  private parseSegmentMatches(responseText: string): {
    matches: Array<{ id: number; translatedText: string }>;
    hasPartialData: boolean;
  } {
    const { segments, hasPartialData } = this.parseSegmentsWithBestEffort(responseText);

    if (!segments || !Array.isArray(segments)) {
      this.logger.warn('parseSegmentMatches: Invalid format', {
        extra: { responseText, segments },
      });
      throw new TranslationParsingError('Invalid translation response format', {
        shouldReduceBatchSize: true,
      });
    }

    const matches: Array<{ id: number; translatedText: string }> = [];
    for (const segment of segments) {
      if (!segment || typeof segment !== 'object') continue;
      const parsedId =
        typeof segment.id === 'number' ? segment.id : Number.parseInt(String(segment.id ?? ''), 10);
      if (!Number.isFinite(parsedId)) continue;
      const translatedText =
        typeof segment.translated_text === 'string' ? segment.translated_text : '';
      matches.push({
        id: parsedId,
        translatedText,
      });
    }
    return { matches, hasPartialData };
  }

  private parseSegmentsWithBestEffort(responseText: string): ParsedSegmentResult {
    if (!responseText?.trim()) {
      this.logger.warn('parseSegmentMatches: empty response payload detected', {
        extra: { responseLength: responseText?.length ?? 0 },
      });
      return { segments: [], hasPartialData: true };
    }

    try {
      const payload = JSON.parse(responseText) as { segments?: TranslationSegment[] };
      return { segments: payload?.segments ?? [], hasPartialData: false };
    } catch (error) {
      this.logger.warn('parseSegmentMatches: JSON parse error', {
        extra: { responseText },
        cause: errorToString(error),
      });

      const salvageResult = this.salvageSegmentsFromPartialJson(responseText);
      if (salvageResult.segments.length < 3) {
        throw new TranslationParsingError('Failed to parse JSON translation response', {
          cause: error,
          shouldReduceBatchSize: true,
        });
      }

      const safeLength = salvageResult.hasOpenArray
        ? Math.max(0, salvageResult.segments.length - 2)
        : salvageResult.segments.length;
      const safeSegments = salvageResult.segments.slice(0, safeLength);
      if (safeSegments.length === 0) {
        throw new TranslationParsingError('Failed to parse JSON translation response', {
          cause: error,
          shouldReduceBatchSize: true,
        });
      }

      this.logger.warn('parseSegmentMatches: recovered partial JSON response', {
        extra: {
          recoveredCount: safeSegments.length,
          originalCount: salvageResult.segments.length,
          truncated: salvageResult.hasOpenArray,
        },
      });

      return { segments: safeSegments, hasPartialData: true };
    }
  }

  private salvageSegmentsFromPartialJson(responseText: string): {
    segments: TranslationSegment[];
    hasOpenArray: boolean;
  } {
    const segments: TranslationSegment[] = [];
    const segmentsKeyIndex = responseText.indexOf('"segments"');
    if (segmentsKeyIndex === -1) {
      return { segments, hasOpenArray: false };
    }

    const arrayStart = responseText.indexOf('[', segmentsKeyIndex);
    if (arrayStart === -1) {
      return { segments, hasOpenArray: false };
    }

    let inString = false;
    let isEscaped = false;
    let braceDepth = 0;
    let currentStart = -1;
    let arrayClosed = false;

    for (let i = arrayStart + 1; i < responseText.length; i++) {
      const char = responseText[i];
      if (inString) {
        if (isEscaped) {
          isEscaped = false;
        } else if (char === '\\') {
          isEscaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === '{') {
        if (braceDepth === 0) {
          currentStart = i;
        }
        braceDepth++;
        continue;
      }

      if (char === '}') {
        braceDepth--;
        if (braceDepth === 0 && currentStart !== -1) {
          const snippet = responseText.slice(currentStart, i + 1);
          try {
            const segment = JSON.parse(snippet) as TranslationSegment;
            segments.push(segment);
          } catch (innerError) {
            this.logger.debug('salvageSegmentsFromPartialJson: skip invalid segment', {
              snippet,
              cause: errorToString(innerError),
            });
          }
          currentStart = -1;
        }
        continue;
      }

      if (char === ']' && braceDepth === 0) {
        arrayClosed = true;
        break;
      }
    }

    return { segments, hasOpenArray: !arrayClosed };
  }

  private calculateOffset(matches: Array<{ id: number }>): number {
    return matches.length > 0 ? Math.max(0, Math.min(...matches.map(({ id }) => id)) - 1) : 0;
  }

  private determineSuccessAndDuplicates(matches: Array<{ id: number }>): {
    successfulIds: Set<number>;
    duplicateIds: Set<number>;
  } {
    const successfulIds = new Set<number>();
    const duplicateIds = new Set<number>();
    for (const { id } of matches) {
      if (successfulIds.has(id)) {
        duplicateIds.add(id);
      } else {
        successfulIds.add(id);
      }
    }
    return { successfulIds, duplicateIds };
  }

  private findFirstFailureNormalized(
    successfulIds: Set<number>,
    duplicateIds: Set<number>,
    offset: number,
    totalLength: number
  ): number {
    for (let i = 1; i <= totalLength; i++) {
      const originalId = i + offset;
      if (!successfulIds.has(originalId) || duplicateIds.has(originalId)) {
        return i;
      }
    }
    return Infinity;
  }

  private calculateExcludeFrom(firstFailure: number): number {
    if (!Number.isFinite(firstFailure)) {
      return Infinity;
    }
    return Math.max(1, firstFailure);
  }

  private buildTranslations(
    matches: Array<{ id: number; translatedText: string }>,
    offset: number,
    excludeFrom: number,
    remainingTextArray: string[],
    remainingTexts: Map<string, number[]>
  ): Map<string, TranslationResult> {
    const translations = new Map<string, TranslationResult>();
    for (const { id, translatedText } of matches) {
      const normalizedId = id - offset;
      if (normalizedId < 1 || normalizedId > remainingTextArray.length) continue;
      // Once the model misses or duplicates an ID we treat the remainder as unreliable.
      // `excludeFrom` is derived from the first failure index so we discard any entries
      // from that point onward to avoid committing partial/garbled translations.
      if (normalizedId >= excludeFrom) continue;

      const originalText = remainingTextArray[normalizedId - 1];
      const indices = remainingTexts.get(originalText) || [];
      if (translatedText.trim()) {
        translations.set(originalText, {
          text: translatedText.trim(),
          indices,
        });
      }
    }
    return translations;
  }

  public async parseTranslationResponse(
    response: AiChatResponse,
    remainingTexts: Map<string, number[]>
  ): Promise<{ translations: Map<string, TranslationResult>; hasPartialData: boolean }> {
    const responseText = this.getResponseText(response);
    const remainingTextArray = Array.from(remainingTexts.keys());

    const { matches, hasPartialData } = this.parseSegmentMatches(responseText);
    const offset = this.calculateOffset(matches);
    const { successfulIds, duplicateIds } = this.determineSuccessAndDuplicates(matches);
    const firstFailure = this.findFirstFailureNormalized(
      successfulIds,
      duplicateIds,
      offset,
      remainingTextArray.length
    );
    const excludeFrom = this.calculateExcludeFrom(firstFailure);
    const translations = this.buildTranslations(
      matches,
      offset,
      excludeFrom,
      remainingTextArray,
      remainingTexts
    );

    const finishReason = this.getFinishReason(response);
    const loggingString = Array.from(translations.keys())
      .map((text) => `${text} => ${translations.get(text)?.text || ''}`)
      .join('\n');
    this.logger.debug(`parseTranslationResponse(${translations.size})`, {
      loggingString,
      responseText,
      finishReason,
      offset,
    });

    return { translations, hasPartialData };
  }
}
