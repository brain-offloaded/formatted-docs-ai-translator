import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

import { TranslationResult } from '../../../types/translators';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class AiResponseService {
  constructor(private readonly logger: LoggerService) {}

  public async parseTranslationResponse(
    response: OpenAI.Chat.Completions.ChatCompletion,
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
  private getFinishReason(response: OpenAI.Chat.Completions.ChatCompletion): string {
    const finishReason = response.choices?.[0]?.finish_reason;
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

  /**
   * 최대 토큰으로 응답이 종료되었는지 확인하는 함수
   */
  private isFinishedByMaxTokens(response: OpenAI.Chat.Completions.ChatCompletion): boolean {
    const finishReason = this.getFinishReason(response);
    return finishReason === 'length';
  }

  /**
   * 응답 텍스트를 가져오는 함수
   */
  protected async getResponseText(
    response: OpenAI.Chat.Completions.ChatCompletion
  ): Promise<string> {
    const responseText = response.choices[0].message.content || '';
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
    response: OpenAI.Chat.Completions.ChatCompletion;
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
