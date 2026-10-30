import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
  AiChatRequest,
  AiChatResponse,
  AiMessage,
  AiMessageContent,
  AiMessagePart,
  AiProxyError,
} from '../../dto/common-ai.dto';
import { getProviderUrl } from '@/nest/ai/services/providers/provider-url';
import { LoggerService } from '@/nest/logger/logger.service';
import {
  ModelProvider,
  TranslatorAiSettings,
} from '@/nest/translator/common/dto/translator-settings.dto';

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeJsonPatch = (
  target: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> => {
  const result = { ...target };

  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete result[key];
    } else if (isJsonObject(value)) {
      result[key] = mergeJsonPatch(isJsonObject(result[key]) ? result[key] : {}, value);
    } else {
      result[key] = value;
    }
  }

  return result;
};

const inferJsonSchemaName = (schema: Record<string, unknown>): string => {
  if (typeof schema.title === 'string' && schema.title.trim()) return schema.title;
  if (typeof schema.$id === 'string' && schema.$id.trim()) return schema.$id;
  const properties = schema.properties;
  if (isJsonObject(properties)) {
    if ('segments' in properties) return 'text_translation';
    if ('ocr_result' in properties || 'translated_result' in properties) {
      return 'image_ocr_translation';
    }
  }
  return 'structured_response';
};

const toOpenAiResponseFormat = (
  responseFormat: AiChatRequest['responseFormat']
): Record<string, unknown> => {
  const schema = responseFormat?.jsonSchema;
  if (!isJsonObject(schema)) {
    throw new Error('$JSON_SCHEMA was used, but this request has no JSON schema.');
  }

  const jsonSchema =
    typeof schema.name === 'string' && schema.name && isJsonObject(schema.schema)
      ? schema
      : {
          name: inferJsonSchemaName(schema),
          strict: true,
          schema,
        };

  return { type: 'json_schema', json_schema: jsonSchema };
};

const expandBodyTemplates = (
  value: unknown,
  context: {
    apiKey: string;
    model: string;
    maxToken?: number;
    jsonSchema?: Record<string, unknown>;
  }
): unknown => {
  if (value === '$API_KEY') return context.apiKey;
  if (value === '$MODEL' || value === '$MODEL_NAME') return context.model;
  if (value === '$MAX_TOKEN') {
    if (typeof context.maxToken !== 'number' || !Number.isFinite(context.maxToken)) {
      throw new Error('$MAX_TOKEN was used, but this request has no output token limit.');
    }
    return context.maxToken;
  }
  if (value === '$JSON_SCHEMA') {
    if (!context.jsonSchema) {
      throw new Error('$JSON_SCHEMA was used, but this request has no JSON schema.');
    }
    return context.jsonSchema;
  }
  if (typeof value === 'string') {
    return value.replace(/\$(API_KEY|MODEL_NAME|MODEL|MAX_TOKEN)/g, (_, name: string) => {
      if (name === 'API_KEY') return context.apiKey;
      if (name === 'MODEL' || name === 'MODEL_NAME') return context.model;
      return String(context.maxToken ?? '');
    });
  }
  if (Array.isArray(value)) {
    return value.map((item) => expandBodyTemplates(item, context));
  }
  if (isJsonObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, expandBodyTemplates(child, context)])
    );
  }
  return value;
};

const redactSecret = (value: unknown, secret: string): unknown => {
  if (typeof value === 'string') {
    return secret ? value.split(secret).join('[REDACTED]') : value;
  }
  if (Array.isArray(value)) return value.map((item) => redactSecret(item, secret));
  if (isJsonObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, redactSecret(child, secret)])
    );
  }
  return value;
};

const expandHeaderTemplate = (value: string, apiKey: string, model: string): string =>
  value.replace(/\$(API_KEY|MODEL_NAME|MODEL)/g, (_, name: string) =>
    name === 'API_KEY' ? apiKey : model
  );

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
    const baseURL = getProviderUrl(provider, aiSettings.baseUrl?.trim());
    if (!baseURL) {
      throw new AiProxyError('OpenAI-compatible Base URL is required.');
    }
    const client = this.getOpenAIClient(baseURL, apiKey);
    const model = request.model || modelName;
    const customHeaders = Object.fromEntries(
      Object.entries(aiSettings.customHeaders ?? {})
        .filter(([name]) => name.toLowerCase() !== 'authorization')
        .map(([name, value]) => [name, expandHeaderTemplate(value, apiKey, model)])
    );
    const defaultBody = {
      model,
      messages: request.messages.map((m) => this.toOpenAiMessage(m)),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
    };
    const customBody = expandBodyTemplates(aiSettings.customBody ?? {}, {
      apiKey,
      model,
      maxToken: request.maxTokens,
      jsonSchema: request.responseFormat
        ? toOpenAiResponseFormat(request.responseFormat)
        : undefined,
    }) as Record<string, unknown>;
    const outgoingRequest = {
      url: `${baseURL.replace(/\/$/, '')}/chat/completions`,
      method: 'POST',
      body: mergeJsonPatch(defaultBody, customBody),
      headers: {
        Authorization: 'Bearer [REDACTED]',
        'Content-Type': 'application/json',
        ...customHeaders,
      },
    };
    const loggedRequest = {
      ...outgoingRequest,
      body: redactSecret(outgoingRequest.body, apiKey),
      headers: redactSecret(outgoingRequest.headers, apiKey),
    };
    try {
      const response = await client.chat.completions.create(
        outgoingRequest.body as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
        { headers: customHeaders }
      );
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
      const cause = err as {
        headers?: Headers | Record<string, string>;
        error?: unknown;
      };
      const responseHeaders =
        cause?.headers instanceof Headers
          ? Object.fromEntries(cause.headers.entries())
          : cause?.headers;
      this.logger.error('AI provider HTTP 요청 실패', {
        provider,
        request: loggedRequest,
        response: {
          status,
          headers: redactSecret(responseHeaders, apiKey),
          body: redactSecret(cause?.error ?? e?.response?.data ?? e?.message, apiKey),
        },
      });
      throw new AiProxyError(e?.message || 'AI proxy request failed', {
        status,
        code,
        cause: err,
      });
    }
  }
}
