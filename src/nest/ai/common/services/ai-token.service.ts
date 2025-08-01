import { Injectable } from '@nestjs/common';
import { calculateDefaultMaxInputTokenCount } from '@/ai/model';

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
  }: {
    useThinking: boolean;
    texts: string[];
    maxOutputTokenCount: number;
  }): Promise<string[][]> {
    const maxInputTokens = calculateDefaultMaxInputTokenCount({
      useThinking,
      maxOutputTokenCount,
    });

    // 모든 텍스트에 대한 토큰 수를 미리 계산
    const textWithTokens = await Promise.all(
      texts.map(async (text) => ({
        text,
        tokenCount: await this.getEstimatedTokenCount(text),
      }))
    );

    // 전체 토큰 수 계산
    const totalTokenCount = textWithTokens.reduce((sum, item) => sum + item.tokenCount, 0);

    // 전체 토큰 수가 최대 입력 토큰 수 이하면 그대로 반환
    if (totalTokenCount <= maxInputTokens) {
      return [texts];
    }

    // 배치 그룹으로 분할
    const batchGroups: string[][] = [];
    let currentGroup: string[] = [];
    let currentTokenCount = 0;

    for (const { text, tokenCount } of textWithTokens) {
      if (currentTokenCount + tokenCount > maxInputTokens) {
        if (currentGroup.length > 0) {
          batchGroups.push(currentGroup);
          currentGroup = [];
          currentTokenCount = 0;
        }

        // 단일 텍스트가 최대 토큰 수보다 큰 경우 처리
        if (tokenCount > maxInputTokens) {
          batchGroups.push([text]);
          continue;
        }
      }

      currentGroup.push(text);
      currentTokenCount += tokenCount;
    }

    // 마지막 그룹 추가
    if (currentGroup.length > 0) {
      batchGroups.push(currentGroup);
    }

    return batchGroups;
  }
}
