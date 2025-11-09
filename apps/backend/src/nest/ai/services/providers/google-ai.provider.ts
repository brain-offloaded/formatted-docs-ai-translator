import { Injectable } from '@nestjs/common';
import {
  GenerateContentConfig,
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  SafetySetting,
  type Content,
} from '@google/genai';
import {
  AiChatRequest,
  AiChatResponse,
  AiChatChoice,
  AiMessageContent,
  AiMessagePart,
  AiProxyError,
  toTextFromMessageContent,
} from '../../dto/common-ai.dto';
import { LoggerService } from '@/nest/logger/logger.service';
import { GoogleStyleProviderBase } from './google-style-base.provider';
import { errorToString } from '@/nest/utils/error-stringify';
import {
  ModelProvider,
  TranslatorAiSettings,
} from '@/nest/translator/common/dto/translator-settings.dto';

interface VertexAIConfig {
  projectId: string;
  location: string;
  credentials: {
    client_email: string;
    private_key: string;
  };
}

@Injectable()
export class GoogleAiProviderService extends GoogleStyleProviderBase {
  constructor(logger: LoggerService) {
    super(logger);
  }

  private readonly vertexClients = new Map<string, GoogleGenAI>();

  /**
   * Parse Vertex AI service account JSON key
   */
  private parseVertexAIKey(apiKey: string): VertexAIConfig | null {
    try {
      const parsed = JSON.parse(apiKey);
      if (!parsed || parsed.type !== 'service_account') {
        return null;
      }
      const { project_id, client_email, private_key } = parsed as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (!project_id || !client_email || !private_key) {
        throw new Error('Missing required service account fields');
      }
      return {
        projectId: project_id,
        location: 'us-central1', // Default location
        credentials: {
          client_email,
          private_key: private_key.replace(/\\n/g, '\n'),
        },
      };
    } catch (err) {
      this.logger.debug('Not a Vertex AI service account key', { err: errorToString(err) });
      return null;
    }
  }

  /**
   * Get or create Google GenAI client for Gemini API (simple API key)
   */
  private getGoogleClient(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Get or create Google GenAI client for Vertex AI (service account)
   */
  private getVertexClient(apiKey: string, config: VertexAIConfig): GoogleGenAI {
    if (this.vertexClients.has(apiKey)) {
      return this.vertexClients.get(apiKey)!;
    }
    try {
      const client = new GoogleGenAI({
        vertexai: true,
        project: config.projectId,
        location: config.location,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        googleAuthOptions: config.credentials as any,
      });
      this.vertexClients.set(apiKey, client);
      return client;
    } catch (err) {
      this.logger.error('Vertex AI client init failed', { err: errorToString(err) });
      throw err;
    }
  }

  supports(p: ModelProvider): boolean {
    return p === ModelProvider.GOOGLE || p === ModelProvider.VERTEX_AI;
  }

  private getClient({
    aiSettings,
    apiKey,
  }: {
    aiSettings: TranslatorAiSettings;
    apiKey: string;
  }): GoogleGenAI {
    // Determine if this is Vertex AI or regular Google AI
    const isVertexAI = aiSettings.modelProvider === ModelProvider.VERTEX_AI;
    const vertexConfig = isVertexAI ? this.parseVertexAIKey(apiKey) : null;

    if (vertexConfig) {
      // Use Vertex AI
      return this.getVertexClient(apiKey, vertexConfig);
    } else {
      // Use regular Google AI (Gemini API)
      return this.getGoogleClient(apiKey);
    }
  }

  private buildSafetySettings(): SafetySetting[] {
    const categories = [
      HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      HarmCategory.HARM_CATEGORY_HARASSMENT,
      HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
    ];
    return categories.map((category) => ({
      category,
      threshold: HarmBlockThreshold.OFF,
    }));
  }

  private buildGenerationConfig({
    systemInstruction = '',
    request,
  }: {
    systemInstruction: string;
    request: AiChatRequest;
  }): GenerateContentConfig {
    const temperature = typeof request.temperature === 'number' ? request.temperature : 0.0;
    const topP = typeof request.topP === 'number' ? request.topP : 0.9;
    const maxOutputTokens = typeof request.maxTokens === 'number' ? request.maxTokens : 8192;
    const responseMimeType =
      request.responseFormat?.type === 'json_schema' ? 'application/json' : 'text/plain';
    const responseSchema =
      request.responseFormat?.type === 'json_schema'
        ? (request.responseFormat.jsonSchema as Record<string, unknown>)
        : undefined;

    const thinkingConfig = this.buildProviderThinkingConfig(request.thinking);

    const safetySettings = this.buildSafetySettings();

    return {
      thinkingConfig,
      systemInstruction,
      temperature,
      topP,
      maxOutputTokens,
      responseMimeType,
      responseSchema,
      safetySettings,
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
    try {
      const genAI = this.getClient({ aiSettings, apiKey });

      const {
        customModelConfig: { modelName },
      } = aiSettings;
      const effectiveModel = request.model || modelName;

      const systemTexts: string[] = [];
      const contents: Content[] = [];
      for (const m of request.messages) {
        if (m.role === 'system') {
          const t = toTextFromMessageContent(m.content);
          if (t) systemTexts.push(t);
        } else {
          const role: 'user' | 'model' = m.role === 'assistant' ? 'model' : 'user';
          contents.push({
            role,
            parts: this.toGoogleParts(m.content),
          });
        }
      }
      const systemInstruction = (systemTexts ?? []).join('\n');

      const generationConfig: GenerateContentConfig = this.buildGenerationConfig({
        systemInstruction,
        request,
      });

      const response = await genAI.models.generateContent({
        model: effectiveModel,
        contents,
        config: generationConfig,
      });

      const candidates = response?.candidates ?? [];
      const usage = response?.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount,
            completionTokens: response.usageMetadata.candidatesTokenCount,
            totalTokens: response.usageMetadata.totalTokenCount,
          }
        : undefined;

      const choices: AiChatChoice[] = candidates.map((c) => {
        const parts = c?.content?.parts || [];
        const textParts: Array<Extract<AiMessagePart, { type: 'text' }>> = [];
        for (const p of parts) {
          if (typeof p?.text === 'string') textParts.push({ type: 'text', text: p.text });
        }
        const content: AiMessageContent =
          textParts.length === 1 ? textParts[0].text : (textParts as AiMessagePart[]);
        return {
          message: { role: 'assistant' as const, content },
          finishReason: this.mapGoogleFinishReason(c?.finishReason),
        };
      });
      if (choices.length === 0)
        choices.push({ message: { role: 'assistant', content: '' }, finishReason: undefined });
      return { choices, usage };
    } catch (err: unknown) {
      const e = err as {
        status?: number;
        code?: string;
        message?: string;
        response?: { status?: number; data?: { error?: { code?: string; message?: string } } };
      };
      const status = e?.status ?? e?.response?.status;
      const code = e?.code ?? e?.response?.data?.error?.code;
      const message =
        e?.message ?? e?.response?.data?.error?.message ?? 'Google AI / Vertex AI request failed';
      const originalError = errorToString(err);
      this.logger.error('Google AI / Vertex AI request failed', {
        status,
        code,
        message,
        originalError,
      });
      throw new AiProxyError(message, { status, code, cause: err });
    }
  }
}
