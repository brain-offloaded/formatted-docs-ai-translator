import { EnhancedGenerateContentResponse, FinishReason } from '@google/generative-ai';
import { Injectable } from '@nestjs/common';

import { TranslationResult } from '../../../../types/translators';
import { LoggerService } from '../../../logger/logger.service';

@Injectable()
export class AiResponseService {
  constructor(private readonly logger: LoggerService) {}

  public async parseTranslationResponse(
    response: EnhancedGenerateContentResponse,
    remainingTexts: Map<string, number[]>
  ): Promise<Map<string, TranslationResult>> {
    const responseText = await this.getResponseText(response);
    const translations = new Map<string, TranslationResult>();
    const regex = /<\|(\d+)\|>(.*?)(?=(<\|\d+\|>|$))/gm;
    const remainingTextArray = Array.from(remainingTexts.keys());

    let match;
    while ((match = regex.exec(responseText)) !== null) {
      const [, idStr, translatedText] = match;
      const id = parseInt(idStr);
      if (id < 1 || id > remainingTextArray.length) continue;

      const originalText = remainingTextArray[id - 1];
      const indices = remainingTexts.get(originalText) || [];
      if (translatedText.trim()) {
        translations.set(originalText, {
          text: translatedText.trim(),
          indices,
        });
      }
    }

    await this.logResponse({
      response,
      translations,
      remainingTexts,
      responseText,
      remainingTextArray,
    });

    return translations;
  }

  /**
   * 응답의 종료 이유를 가져오는 함수
   */
  private getFinishReason(response: EnhancedGenerateContentResponse): string {
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === FinishReason.OTHER || !finishReason) {
      this.logger.debug('getFinishReason: OTHER', {
        extra: {
          candidates: response.candidates,
          promptFeedback: response.promptFeedback,
          usageMetadata: response.usageMetadata,
          finishReason,
        },
      });
    }
    return finishReason ?? 'CUSTOM_UNKNOWN';
  }

  /**
   * 최대 토큰으로 응답이 종료되었는지 확인하는 함수
   */
  private isFinishedByMaxTokens(response: EnhancedGenerateContentResponse): boolean {
    const finishReason = this.getFinishReason(response);
    return finishReason === FinishReason.MAX_TOKENS;
  }

  /**
   * 응답 텍스트를 가져오는 함수
   */
  protected async getResponseText(response: EnhancedGenerateContentResponse): Promise<string> {
    const responseText = response.text();
    if (this.isFinishedByMaxTokens(response)) {
      const lastTagIndex = responseText.lastIndexOf('<|');
      if (lastTagIndex > 0) {
        return responseText.substring(0, lastTagIndex);
      }
    }
    return responseText;
  }

  protected async logResponse({
    response,
    translations,
    remainingTexts: _remainingTexts,
    responseText,
    remainingTextArray: _remainingTextArray,
  }: {
    response: EnhancedGenerateContentResponse;
    translations: Map<string, TranslationResult>;
    remainingTexts: Map<string, number[]>;
    responseText: string;
    remainingTextArray: string[];
  }): Promise<void> {
    const finishReason = this.getFinishReason(response);
    const loggingString = Array.from(translations.keys())
      .map((text) => `${text} => ${translations.get(text)?.text || ''}`)
      .join('\n');

    this.logger.debug(`parseTranslationResponse(${translations.size})`, {
      loggingString,
      responseText,
      finishReason,
    });
  }
}
