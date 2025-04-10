import { Injectable } from '@nestjs/common';

import { GeminiModel } from '../../../../../ai/gemini/gemini-models';
import { AiTokenService } from '../../../common/services/ai-token-service';

@Injectable()
export class GeminiTokenService extends AiTokenService<GeminiModel> {
  public async getEstimatedTokenCount(texts: string[] | string): Promise<number> {
    if (!Array.isArray(texts)) return this.getEstimatedTokenCount([texts]);
    return texts.reduce((sum, text) => sum + Math.ceil(text.length / 2), 0);
  }
}
