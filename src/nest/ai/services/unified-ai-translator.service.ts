import { Inject, Injectable } from '@nestjs/common';
import { GeminiTranslatorService } from '../gemini/translator/services/gemini-translator.service';
import { GeminiModel, isValidGemini } from '../../../ai/gemini/gemini-models';
import { AiTranslateParam, IAiTranslatorService } from '../common/services/i-ai-translator-service';
import { AiModelName } from '../../../ai/model';

@Injectable()
export class UnifiedAiTranslatorService
  implements Pick<IAiTranslatorService<AiModelName>, 'translate'>
{
  constructor(
    @Inject(GeminiTranslatorService)
    private readonly geminiTranslatorService: IAiTranslatorService<GeminiModel>
  ) {}

  private getTranslatorServiceByModelName(modelName: string) {
    if (isValidGemini(modelName)) {
      return this.geminiTranslatorService;
    }

    throw new Error(`Invalid model name: ${modelName}`);
  }

  async translate(modelName: AiModelName, param: AiTranslateParam): Promise<string[]> {
    const aiService = this.getTranslatorServiceByModelName(modelName);
    return await aiService.translate(modelName, param);
  }

  async getEstimatedTokenCount(modelName: AiModelName, texts: string[] | string): Promise<number> {
    const aiService = this.getTranslatorServiceByModelName(modelName);
    return await aiService.getEstimatedTokenCount(texts);
  }
}
