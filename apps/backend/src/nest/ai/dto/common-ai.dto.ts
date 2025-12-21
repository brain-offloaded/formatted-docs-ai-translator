// Common, provider-agnostic AI DTOs used only within our codebase

export type AiRole = 'system' | 'assistant' | 'user';

export type AiMessagePart = { type: 'text'; text: string } | { type: 'image'; imageUrl: string };

export type AiMessageContent = string | AiMessagePart[];

export interface AiMessage {
  role: AiRole;
  content: AiMessageContent;
}

export interface AiResponseFormatJsonSchema {
  type: 'json_schema';
  jsonSchema: unknown;
}

export type AiResponseFormat = AiResponseFormatJsonSchema | undefined;

export interface AiChatRequest {
  model: string;
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  responseFormat?: AiResponseFormat;
  thinking?: {
    enabled: boolean;
    useCustomBudget: boolean;
    budget?: number;
    thinkingLevel?: string;
  };
}

export interface AiChatChoice {
  message: AiMessage;
  finishReason?: string;
}

export interface AiUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AiChatResponse {
  choices: AiChatChoice[];
  usage?: AiUsage;
}

export class AiProxyError extends Error {
  status?: number;
  code?: string;
  constructor(message: string, opts?: { status?: number; code?: string; cause?: unknown }) {
    super(message);
    this.name = 'AiProxyError';
    this.status = opts?.status;
    this.code = opts?.code;
    if (opts?.cause) {
      // Attach cause if runtime supports it
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).cause = opts.cause;
      } catch {
        // ignore attaching cause in environments that don't support it
      }
    }
  }
}

export const toTextFromMessageContent = (content: AiMessageContent): string => {
  if (typeof content === 'string') return content;
  // Concatenate only text parts; ignore images when producing text
  return content
    .filter((p) => p.type === 'text')
    .map((p) => (p as Extract<AiMessagePart, { type: 'text' }>).text)
    .join('\n');
};
