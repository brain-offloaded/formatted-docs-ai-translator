import { Injectable } from '@nestjs/common';
import { AiChatResponse, toTextFromMessageContent } from '../dto/common-ai.dto';
import { TranslationResult } from '@/nest/ai/types/translation-result.interface';
import { LoggerService } from '@/nest/logger/logger.service';
import { errorToString } from '@/nest/utils/error-stringify';
import type { PlaceholderPreservationSettings } from './translator.types';
import { hasPlaceholderPreservationMismatch } from './placeholder-preservation-validator';

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

type TranslationSegment = { id: number; text: string };

interface ParsedSegmentResult {
  segments: TranslationSegment[];
  hasPartialData: boolean;
}

@Injectable()
export class TranslationResponseParser {
  constructor(private readonly logger: LoggerService) {}

  public getFinishReason(response: AiChatResponse): string {
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

  public parseTranslationResponse(
    response: AiChatResponse,
    remainingTexts: Map<string, number[]>,
    expectedIdToText?: Map<number, string>,
    placeholderPreservation?: PlaceholderPreservationSettings
  ): {
    translations: Map<string, TranslationResult>;
    hasPartialData: boolean;
    validationMismatchTexts: Set<string>;
  } {
    const responseText = this.getResponseText(response);
    const { matches, hasPartialData } = this.parseSegmentMatches(responseText);
    const useStrictIdMatching = !!expectedIdToText && expectedIdToText.size > 0;
    let translations: Map<string, TranslationResult>;
    let excludeFrom: number;
    let offset: number | null;
    let expectedIds: number[] = [];
    let unexpectedIdCount: number | undefined;
    const validationMismatchTexts = new Set<string>();

    if (useStrictIdMatching && expectedIdToText) {
      expectedIds = Array.from(expectedIdToText.keys());
      const strictResult = this.buildTranslationsByExpectedIds(
        matches,
        expectedIds,
        expectedIdToText,
        remainingTexts,
        validationMismatchTexts,
        placeholderPreservation
      );
      translations = strictResult.translations;
      excludeFrom = strictResult.excludeFrom;
      offset = strictResult.offset;
      unexpectedIdCount = strictResult.unexpectedIdCount;
    } else {
      const remainingTextArray = Array.from(remainingTexts.keys());
      const fallbackResult = this.buildTranslationsWithOffset(
        matches,
        remainingTextArray,
        remainingTexts,
        validationMismatchTexts,
        placeholderPreservation
      );
      translations = fallbackResult.translations;
      excludeFrom = fallbackResult.excludeFrom;
      offset = fallbackResult.offset;
      unexpectedIdCount = undefined;
    }

    const finishReason = this.getFinishReason(response);
    const loggingString = Array.from(translations.keys())
      .map((text) => `${text} => ${translations.get(text)?.text || ''}`)
      .join('\n');
    this.logger.debug(`parseTranslationResponse(${translations.size})`, {
      loggingString,
      responseText,
      finishReason,
      offset,
      excludeFrom,
      expectedCount: expectedIds.length,
      unexpectedIdCount,
    });

    return { translations, hasPartialData, validationMismatchTexts };
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
      const translatedText = typeof segment.text === 'string' ? segment.text : '';
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

  private determineSuccessAndDuplicatesForExpected(
    matches: Array<{ id: number }>,
    expectedIdSet: Set<number>
  ): { successfulIds: Set<number>; duplicateIds: Set<number>; unexpectedIds: Set<number> } {
    const successfulIds = new Set<number>();
    const duplicateIds = new Set<number>();
    const unexpectedIds = new Set<number>();
    for (const { id } of matches) {
      if (!expectedIdSet.has(id)) {
        unexpectedIds.add(id);
        continue;
      }
      if (successfulIds.has(id)) {
        duplicateIds.add(id);
      } else {
        successfulIds.add(id);
      }
    }
    return { successfulIds, duplicateIds, unexpectedIds };
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

  private findFirstFailureByExpectedIds(
    expectedIds: number[],
    successfulIds: Set<number>,
    duplicateIds: Set<number>
  ): number {
    for (let i = 0; i < expectedIds.length; i++) {
      const expectedId = expectedIds[i];
      if (!successfulIds.has(expectedId) || duplicateIds.has(expectedId)) {
        return i + 1;
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

  private buildTranslationsWithOffset(
    matches: Array<{ id: number; translatedText: string }>,
    remainingTextArray: string[],
    remainingTexts: Map<string, number[]>,
    validationMismatchTexts: Set<string>,
    placeholderPreservation?: PlaceholderPreservationSettings
  ): { translations: Map<string, TranslationResult>; excludeFrom: number; offset: number } {
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
      remainingTexts,
      validationMismatchTexts,
      placeholderPreservation
    );
    return { translations, excludeFrom, offset };
  }

  private buildTranslationsByExpectedIds(
    matches: Array<{ id: number; translatedText: string }>,
    expectedIds: number[],
    expectedIdToText: Map<number, string>,
    remainingTexts: Map<string, number[]>,
    validationMismatchTexts: Set<string>,
    placeholderPreservation?: PlaceholderPreservationSettings
  ): {
    translations: Map<string, TranslationResult>;
    excludeFrom: number;
    offset: number | null;
    unexpectedIdCount: number;
  } {
    const expectedIdSet = new Set(expectedIds);
    const { successfulIds, duplicateIds, unexpectedIds } =
      this.determineSuccessAndDuplicatesForExpected(matches, expectedIdSet);
    const firstFailure = this.findFirstFailureByExpectedIds(
      expectedIds,
      successfulIds,
      duplicateIds
    );
    const excludeFrom = this.calculateExcludeFrom(firstFailure);
    const expectedIndexById = new Map<number, number>();
    expectedIds.forEach((id, index) => {
      expectedIndexById.set(id, index + 1);
    });

    const translations = new Map<string, TranslationResult>();
    for (const { id, translatedText } of matches) {
      const expectedIndex = expectedIndexById.get(id);
      if (!expectedIndex) continue;
      if (expectedIndex >= excludeFrom) continue;
      const originalText = expectedIdToText.get(id);
      if (!originalText) continue;
      const normalizedOriginal = originalText.trim();
      const normalizedTranslated = translatedText.trim();
      if (
        placeholderPreservation?.enabled &&
        Array.isArray(placeholderPreservation.rules) &&
        placeholderPreservation.rules.length > 0
      ) {
        const mismatch = hasPlaceholderPreservationMismatch({
          beforeText: normalizedOriginal,
          afterText: normalizedTranslated,
          placeholderPreservation,
          warn: (message, meta) => this.logger.warn(message, meta),
        });
        if (mismatch) {
          validationMismatchTexts.add(originalText);
          this.logger.warn('플레이스홀더 보존 불일치로 번역 제외', {
            id,
            originalLength: normalizedOriginal.length,
            translatedLength: normalizedTranslated.length,
          });
          continue;
        }
      }
      const indices = remainingTexts.get(originalText) || [];
      if (normalizedTranslated) {
        translations.set(originalText, {
          text: normalizedTranslated,
          indices,
        });
      }
    }

    return {
      translations,
      excludeFrom,
      offset: null,
      unexpectedIdCount: unexpectedIds.size,
    };
  }

  private buildTranslations(
    matches: Array<{ id: number; translatedText: string }>,
    offset: number,
    excludeFrom: number,
    remainingTextArray: string[],
    remainingTexts: Map<string, number[]>,
    validationMismatchTexts: Set<string>,
    placeholderPreservation?: PlaceholderPreservationSettings
  ): Map<string, TranslationResult> {
    const translations = new Map<string, TranslationResult>();
    for (const { id, translatedText } of matches) {
      const normalizedId = id - offset;
      if (normalizedId < 1 || normalizedId > remainingTextArray.length) continue;
      if (normalizedId >= excludeFrom) continue;

      const originalText = remainingTextArray[normalizedId - 1];
      const normalizedOriginal = originalText.trim();
      const normalizedTranslated = translatedText.trim();
      if (
        placeholderPreservation?.enabled &&
        Array.isArray(placeholderPreservation.rules) &&
        placeholderPreservation.rules.length > 0
      ) {
        const mismatch = hasPlaceholderPreservationMismatch({
          beforeText: normalizedOriginal,
          afterText: normalizedTranslated,
          placeholderPreservation,
          warn: (message, meta) => this.logger.warn(message, meta),
        });
        if (mismatch) {
          validationMismatchTexts.add(originalText);
          this.logger.warn('플레이스홀더 보존 불일치로 번역 제외', {
            id,
            normalizedId,
            originalLength: normalizedOriginal.length,
            translatedLength: normalizedTranslated.length,
          });
          continue;
        }
      }
      const indices = remainingTexts.get(originalText) || [];
      if (normalizedTranslated) {
        translations.set(originalText, {
          text: normalizedTranslated,
          indices,
        });
      }
    }
    return translations;
  }
}
