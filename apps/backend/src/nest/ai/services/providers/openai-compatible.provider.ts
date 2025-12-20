import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import type { ResponseFormatJSONSchema } from 'openai/resources/index';
import {
  AiChatRequest,
  AiChatResponse,
  AiMessage,
  AiMessageContent,
  AiMessagePart,
  AiProxyError,
  AiResponseFormat,
} from '../../dto/common-ai.dto';
import { getProviderUrl } from '@/nest/ai/services/providers/provider-url';
import { LoggerService } from '@/nest/logger/logger.service';
import {
  ModelProvider,
  TranslatorAiSettings,
} from '@/nest/translator/common/dto/translator-settings.dto';

@Injectable()
export class OpenAiCompatibleProviderService {
  constructor(private readonly logger: LoggerService) {}

  supports(p: ModelProvider): boolean {
    return ![ModelProvider.GOOGLE, ModelProvider.VERTEX_AI].includes(p);
  }

  private getOpenAIClient(baseURL: string, apiKey: string): OpenAI {
    return new OpenAI({ baseURL, apiKey });
  }

  private toOpenAiMessage(m: AiMessage): OpenAI.Chat.Completions.ChatCompletionMessageParam {
    if (m.role === 'user') {
      const content = this.toOpenAiUserContent(m.content);
      return { role: 'user', content };
    }
    const text = this.toTextOnly(m.content);
    if (m.role === 'system') return { role: 'system', content: text };
    return { role: 'assistant', content: text };
  }
  private toOpenAiUserContent(
    content: AiMessageContent
  ): string | OpenAI.Chat.Completions.ChatCompletionContentPart[] {
    if (typeof content === 'string') return content;
    const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
    for (const p of content as AiMessagePart[]) {
      if (p.type === 'text') parts.push({ type: 'text', text: p.text });
      else if (p.type === 'image')
        parts.push({ type: 'image_url', image_url: { url: p.imageUrl } });
    }
    return parts;
  }
  private toTextOnly(content: AiMessageContent): string {
    if (typeof content === 'string') return content;
    return (content as AiMessagePart[])
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('\n');
  }
  private fromOpenAiContent(
    content: OpenAI.Chat.Completions.ChatCompletionMessage['content']
  ): AiMessageContent {
    if (typeof content === 'string') return content;
    if (!Array.isArray(content)) return '';
    const parts: AiMessagePart[] = [];
    for (const part of content as Array<
      | OpenAI.Chat.Completions.ChatCompletionContentPartText
      | OpenAI.Chat.Completions.ChatCompletionContentPartImage
    >) {
      if (part.type === 'text') parts.push({ type: 'text', text: part.text });
      else if (part.type === 'image_url')
        parts.push({ type: 'image', imageUrl: part.image_url.url });
    }
    return parts;
  }
  private fromOpenAiResponse(resp: OpenAI.Chat.Completions.ChatCompletion): AiChatResponse {
    const choices = (resp.choices || []).map((c) => {
      const message: AiMessage = {
        role: (c.message.role as AiMessage['role']) || 'assistant',
        content: this.fromOpenAiContent(c.message.content),
      };
      return { message, finishReason: c.finish_reason || undefined };
    });
    return {
      choices,
      usage: resp.usage
        ? {
            promptTokens: resp.usage.prompt_tokens || undefined,
            completionTokens: resp.usage.completion_tokens || undefined,
            totalTokens: resp.usage.total_tokens || undefined,
          }
        : undefined,
    };
  }

  private toOpenAiResponseFormat(
    aiResponseFormat: AiResponseFormat
  ): ResponseFormatJSONSchema | undefined {
    if (aiResponseFormat?.type !== 'json_schema') return undefined;
    const rawSchema = aiResponseFormat.jsonSchema as unknown;
    if (this.isOpenAiJsonSchema(rawSchema)) {
      return { type: 'json_schema', json_schema: rawSchema };
    }
    return {
      type: 'json_schema',
      json_schema: {
        name: this.inferResponseFormatName(rawSchema),
        schema: rawSchema as Record<string, unknown>,
      },
    };
  }

  private isOpenAiJsonSchema(schema: unknown): schema is ResponseFormatJSONSchema.JSONSchema {
    if (!schema || typeof schema !== 'object') return false;
    const candidate = schema as Record<string, unknown>;
    const name = candidate?.name;
    const hasName = typeof name === 'string' && name.length > 0;
    const hasSchema = typeof candidate?.schema === 'object' && candidate.schema !== null;
    const hasMetadata =
      typeof candidate?.description === 'string' || typeof candidate?.strict === 'boolean';
    return hasName && (hasSchema || hasMetadata);
  }

  private inferResponseFormatName(schema: unknown): string {
    if (!schema || typeof schema !== 'object') return 'structured_response';
    const properties = (schema as Record<string, unknown>)?.properties;
    if (properties && typeof properties === 'object') {
      if ('segments' in properties) return 'text_translation';
      if ('ocr_result' in properties || 'translated_result' in properties) {
        return 'image_ocr_translation';
      }
    }
    return 'structured_response';
  }

  async chat({
    aiSettings,
    request,
    apiKey,
  }: {
    aiSettings: TranslatorAiSettings;
    request: AiChatRequest;
    apiKey: string;
  }): Promise<AiChatResponse> {
    const {
      modelProvider: provider,
      customModelConfig: { modelName },
    } = aiSettings;
    const baseURL = getProviderUrl(provider, aiSettings.baseUrl);
    if (!baseURL) {
      throw new AiProxyError('OpenAI-compatible baseUrl is required.');
    }
    const client = this.getOpenAIClient(baseURL, apiKey);
    try {
      const response = await client.chat.completions.create({
        model: request.model || modelName,
        messages: request.messages.map((m) => this.toOpenAiMessage(m)),
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        response_format: this.toOpenAiResponseFormat(request.responseFormat),
      });
      return this.fromOpenAiResponse(response);
    } catch (err: unknown) {
      const e = err as {
        status?: number;
        code?: string;
        message?: string;
        response?: { status?: number; data?: { error?: { code?: string } } };
      };
      const status = e?.status ?? e?.response?.status;
      const code = e?.code ?? e?.response?.data?.error?.code;
      throw new AiProxyError(e?.message || 'AI proxy request failed', {
        status,
        code,
        cause: err,
      });
    }
  }
}
