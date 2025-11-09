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

  private parseSegmentMatches(responseText: string): Array<{ id: number; translatedText: string }> {
    let payload: { segments?: TranslationSegment[] };
    try {
      payload = responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      this.logger.warn('parseSegmentMatches: JSON parse error', {
        extra: { responseText },
        cause: errorToString(error),
      });
      throw new TranslationParsingError('Failed to parse JSON translation response', {
        cause: error,
        shouldReduceBatchSize: true,
      });
    }

    if (!payload?.segments || !Array.isArray(payload.segments)) {
      this.logger.warn('parseSegmentMatches: Invalid format', {
        extra: { responseText, payload },
      });
      throw new TranslationParsingError('Invalid translation response format', {
        shouldReduceBatchSize: true,
      });
    }

    const matches: Array<{ id: number; translatedText: string }> = [];
    for (const segment of payload.segments) {
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
    return matches;
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
    const excludeFrom = firstFailure - 1;
    return excludeFrom < 1 ? 1 : excludeFrom;
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
  ): Promise<Map<string, TranslationResult>> {
    const responseText = this.getResponseText(response);
    const remainingTextArray = Array.from(remainingTexts.keys());

    const matches = this.parseSegmentMatches(responseText);
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

    return translations;
  }
}
