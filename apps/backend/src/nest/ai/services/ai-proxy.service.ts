import { Injectable } from '@nestjs/common';
import { AiChatRequest, AiChatResponse } from '../dto/common-ai.dto';
import { GoogleAiProviderService } from './providers/google-ai.provider';
import { OpenAiCompatibleProviderService } from './providers/openai-compatible.provider';
import {
  ModelProvider,
  TranslatorAiSettings,
} from '@/nest/translator/common/dto/translator-settings.dto';
import { TranslationResult } from '@/nest/ai/types/translation-result.interface';
import { TranslationResponseParser } from './translation-response-parser.service';

@Injectable()
export class AiProxyService {
  constructor(
    private readonly googleProvider: GoogleAiProviderService,
    private readonly openAiProvider: OpenAiCompatibleProviderService,
    private readonly responseParser: TranslationResponseParser
  ) {}

  async chat({
    aiSettings,
    request,
    apiKey,
  }: {
    aiSettings: TranslatorAiSettings;
    request: AiChatRequest;
    apiKey: string;
  }): Promise<AiChatResponse> {
    const { modelProvider: provider } = aiSettings;
    switch (provider) {
      case ModelProvider.GOOGLE:
      case ModelProvider.VERTEX_AI:
        return this.googleProvider.chat({ aiSettings, request, apiKey });
      default:
        return this.openAiProvider.chat({ aiSettings, request, apiKey });
    }
  }

  public isFinishedByMaxTokens(response: AiChatResponse): boolean {
    return this.responseParser.isFinishedByMaxTokens(response);
  }

  public async parseTranslationResponse(
    response: AiChatResponse,
    remainingTexts: Map<string, number[]>,
    expectedIdToText?: Map<number, string>
  ): Promise<{ translations: Map<string, TranslationResult>; hasPartialData: boolean }> {
    return this.responseParser.parseTranslationResponse(response, remainingTexts, expectedIdToText);
  }
}
