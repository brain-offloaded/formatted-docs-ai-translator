import { Injectable } from '@nestjs/common';

import { InvokeFunctionRequest } from '../../../../types/electron';
import { TranslatorResponse } from '../../../../types/translators';
import { convertFullWidthToHalfWidth } from '../../../../utils/language';
import { UnifiedAiTranslatorService } from '../../../ai/services/unified-ai-translator.service';
import { AiModelName } from '../../../../ai/model';
import { IpcChannel } from '../../../common/ipc.channel';

@Injectable()
export class TranslatorService {
  constructor(private readonly unifiedAiTranslatorService: UnifiedAiTranslatorService) {}

  private preprocessText(text: string): string {
    const lineFeedChangedText = text.replaceAll('\r', '\\r').replaceAll('\n', '\\n');
    const fullWidthChangedText = convertFullWidthToHalfWidth(lineFeedChangedText);

    return fullWidthChangedText;
  }

  private postprocessText(text: string): string {
    const lineFeedChangedText = text.replaceAll('\\r', '\r').replaceAll('\\n', '\n');

    return lineFeedChangedText;
  }

  private async createBatches({
    modelName,
    array,
    maxOutputTokenCount,
  }: {
    modelName: AiModelName;
    array: string[];
    maxOutputTokenCount: number;
  }): Promise<string[][]> {
    const estimatedTokens = await this.unifiedAiTranslatorService.getEstimatedTokenCount(
      modelName,
      array
    );

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
    config: {
      sourceLanguage,
      apiKey,
      customModelConfig: { modelName, requestsPerMinute, maxOutputTokenCount },
    },
    textPaths,
    sourceFilePath,
    promptPresetContent,
  }: InvokeFunctionRequest<IpcChannel.TranslateTextArray>): Promise<TranslatorResponse<unknown>> {
    const sourceTexts = textPaths.map((item) => item.text);

    const preprocessedTexts = sourceTexts.map((text) => this.preprocessText(text));

    // 배치 생성
    const batches = await this.createBatches({
      modelName,
      array: preprocessedTexts,
      maxOutputTokenCount,
    });

    const fileInfo = sourceFilePath
      ? {
          fileName: sourceFilePath.split('/').pop() || '',
          filePath: sourceFilePath,
        }
      : undefined;

    // 배치별로 병렬 번역 실행
    const translatedBatches = await Promise.all(
      batches.map((batch) =>
        this.unifiedAiTranslatorService.translate(modelName, {
          sourceTexts: batch,
          sourceLanguage,
          fileInfo,
          apiKey,
          maxOutputTokenCount,
          requestsPerMinute,
          promptPresetContent,
        })
      )
    );

    // 번역 결과 병합
    const translatedTexts = translatedBatches.flat();

    // 번역 결과 후처리 적용
    const postprocessedTexts = translatedTexts.map((text) => this.postprocessText(text));

    // 원본과 번역문을 함께 반환하는 응답 구성
    const translatedTextPaths = textPaths.map((item, index) => ({
      text: item.text,
      translatedText: postprocessedTexts[index],
      path: item.path,
      extra: item.extra,
    }));

    return {
      translatedFilePath: sourceFilePath,
      textPaths: translatedTextPaths,
    };
  }
}
