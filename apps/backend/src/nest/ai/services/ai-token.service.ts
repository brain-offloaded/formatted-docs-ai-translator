import { Injectable } from '@nestjs/common';
import { calculateDefaultMaxInputTokenCount } from '@/nest/ai/utils/model';

@Injectable()
export class AiTokenService {
  public async getEstimatedTokenCount(texts: string[] | string): Promise<number> {
    if (!Array.isArray(texts)) return this.getEstimatedTokenCount([texts]);
    return texts.reduce((sum, text) => sum + Math.ceil(text.length / 2), 0);
  }

  public async getBatchGroups({
    useThinking,
    texts,
    maxOutputTokenCount,
    maxInputCharacterCount,
  }: {
    useThinking: boolean;
    texts: string[];
    maxOutputTokenCount: number;
    maxInputCharacterCount?: number;
  }): Promise<string[][]> {
    const manualCharacterLimit =
      typeof maxInputCharacterCount === 'number' && maxInputCharacterCount > 0
        ? Math.floor(maxInputCharacterCount)
        : undefined;
    const maxBatchSize =
      manualCharacterLimit ??
      calculateDefaultMaxInputTokenCount({
        useThinking,
        maxOutputTokenCount,
      });

    // Measure text once using either the manual character cap or the automatic token estimate.
    const textWithSizes = await Promise.all(
      texts.map(async (text) => ({
        text,
        measuredSize: manualCharacterLimit
          ? Array.from(text).length
          : await this.getEstimatedTokenCount(text),
      }))
    );

    const totalInputSize = textWithSizes.reduce((sum, item) => sum + item.measuredSize, 0);

    if (totalInputSize <= maxBatchSize) {
      return [texts];
    }

    const batchGroups: string[][] = [];
    let currentGroup: string[] = [];
    let currentInputSize = 0;

    for (const { text, measuredSize } of textWithSizes) {
      if (currentInputSize + measuredSize > maxBatchSize) {
        if (currentGroup.length > 0) {
          batchGroups.push(currentGroup);
          currentGroup = [];
          currentInputSize = 0;
        }

        if (measuredSize > maxBatchSize) {
          batchGroups.push([text]);
          continue;
        }
      }

      currentGroup.push(text);
      currentInputSize += measuredSize;
    }

    // 마지막 그룹 추가
    if (currentGroup.length > 0) {
      batchGroups.push(currentGroup);
    }

    return batchGroups;
  }
}
