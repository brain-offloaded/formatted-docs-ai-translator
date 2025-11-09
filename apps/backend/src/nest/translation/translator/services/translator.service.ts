import { Injectable } from '@nestjs/common';

import { convertFullWidthToHalfWidth } from '@apps/common/dist/language';
import { UnifiedAiTranslatorService } from '../../../ai/services/unified-ai-translator.service';
import { TranslateTextArrayRequestDto } from '../dto/request/translate-text-array-request.dto';
import { TranslatedTextPathDto } from '@/nest/translator/common/dto/translation-text-path.dto';

@Injectable()
export class TranslatorService {
  constructor(private readonly unifiedAiTranslatorService: UnifiedAiTranslatorService) {}

  private preprocessText(text: string): string {
    return convertFullWidthToHalfWidth(text);
  }

  private postprocessText(text: string): string {
    return text;
  }

  private async createBatches({
    array,
    maxOutputTokenCount,
  }: {
    array: string[];
    maxOutputTokenCount: number;
  }): Promise<string[][]> {
    const estimatedTokens = await this.unifiedAiTranslatorService.getEstimatedTokenCount(array);

    // 전체 토큰이 최대 출력 토큰보다 작으면 하나의 배치로 반환
    if (estimatedTokens <= maxOutputTokenCount) {
      return [array];
    }

    // 배치 크기 계산 (최대 출력 토큰의 80%를 사용)
    const batchSize = Math.floor((array.length * (maxOutputTokenCount * 0.8)) / estimatedTokens);

    // 최소 1개의 항목은 포함되도록 보장
    const safeBatchSize = Math.max(1, batchSize);

    // 배치 생성
    const batches: string[][] = [];
    for (let i = 0; i < array.length; i += safeBatchSize) {
      batches.push(array.slice(i, i + safeBatchSize));
    }

    return batches;
  }

  public async translate({
    requestId,
    aiSettings,
    textPaths,
    promptPresetContent,
    cacheTag,
  }: TranslateTextArrayRequestDto): Promise<TranslatedTextPathDto[]> {
    const sourceTexts = textPaths.map((item) => item.text);

    const preprocessedTexts = sourceTexts.map((text) => this.preprocessText(text));

    const translationResult = await this.unifiedAiTranslatorService.translate({
      requestId,
      sourceTexts: preprocessedTexts,
      promptPresetContent: promptPresetContent ?? '',
      aiSettings,
      cacheTag,
    });

    const translatedTexts = translationResult;

    // 번역 결과 후처리 적용
    const postprocessedTexts = translatedTexts.map((text) =>
      typeof text === 'string' ? this.postprocessText(text) : text
    );

    // 원본과 번역문을 함께 반환하는 응답 구성
    return textPaths.map((item, index) => {
      const translatedText = postprocessedTexts[index];
      if (typeof translatedText !== 'string') {
        // TODO: Handle ImageOcrTranslationResultDto case
        return {
          ...item,
          translatedText: '',
        };
      }
      return {
        text: item.text,
        translatedText,
        path: item.path,
        extra: item.extra,
      };
    });
  }
}
