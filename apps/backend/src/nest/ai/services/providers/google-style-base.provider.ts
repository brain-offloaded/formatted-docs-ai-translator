import { LoggerService } from '@/nest/logger/logger.service';
import type { ThinkingConfig, ThinkingLevel } from '@google/genai';
import { AiChatRequest, AiMessageContent, AiMessagePart } from '../../dto/common-ai.dto';

export type GoogleContentPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

// 공통: Google / Vertex 공용 유틸 베이스
export abstract class GoogleStyleProviderBase {
  constructor(protected readonly logger: LoggerService) {}

  protected toGoogleParts(content: AiMessageContent): GoogleContentPart[] {
    if (typeof content === 'string') return [{ text: content }];
    const parts: GoogleContentPart[] = [];
    for (const p of content as AiMessagePart[]) {
      if (p.type === 'text') {
        parts.push({ text: p.text });
      } else if (p.type === 'image') {
        const inline = this.dataUrlToInlineData(p.imageUrl);
        if (inline) parts.push({ inlineData: inline });
        else {
          this.logger.debug('Skipping non-data URL image for Google-style provider', {
            imageUrl: p.imageUrl,
          });
        }
      }
    }
    return parts;
  }

  private dataUrlToInlineData(url: string): { mimeType: string; data: string } | undefined {
    try {
      if (!url.startsWith('data:')) return undefined;
      const [meta, data] = url.split(',');
      const mimeMatch = /^data:([^;]+);base64$/.exec(meta);
      if (!mimeMatch || !data) return undefined;
      return { mimeType: mimeMatch[1], data };
    } catch {
      return undefined;
    }
  }

  protected mapGoogleFinishReason(reason?: string): string | undefined {
    switch (reason) {
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
        return 'content_filter';
      case 'STOP':
        return 'stop';
      default:
        return reason;
    }
  }

  protected buildProviderThinkingConfig(
    thinking?: AiChatRequest['thinking']
  ): ThinkingConfig | undefined {
    if (!thinking) return undefined;
    const { enabled, useCustomBudget, budget, thinkingLevel } = thinking;

    if (!enabled) {
      return { includeThoughts: false, thinkingBudget: 0 };
    }

    const normalizedThinkingLevel = typeof thinkingLevel === 'string' ? thinkingLevel.trim() : '';
    if (normalizedThinkingLevel) {
      // 레벨 값은 제공자 확장에 맞춰 그대로 전달하며, 추론 내용은 노출하지 않습니다.
      return {
        includeThoughts: false,
        thinkingBudget: undefined,
        thinkingLevel: normalizedThinkingLevel as ThinkingLevel,
      };
    }

    if (useCustomBudget && typeof budget === 'number' && Number.isFinite(budget)) {
      return { includeThoughts: false, thinkingBudget: budget };
    }

    return { includeThoughts: false, thinkingBudget: -1 };
  }
}
