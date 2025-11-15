import { Injectable } from '@nestjs/common';
import { RateLimiter } from 'limiter';

@Injectable()
export class AiRateLimiterService {
  private readonly rateLimiterMapping: Map<string, RateLimiter> = new Map();

  public async setRateLimiter(modelName: string, requestsPerMinute: number): Promise<void> {
    if (this.rateLimiterMapping.has(modelName)) return;

    this.rateLimiterMapping.set(
      modelName,
      new RateLimiter({
        tokensPerInterval: requestsPerMinute,
        interval: 'minute',
      })
    );
  }

  public async getRateLimiter(modelName: string): Promise<RateLimiter> {
    if (!this.rateLimiterMapping.has(modelName)) {
      await this.setRateLimiter(modelName, 100);
    }

    return this.rateLimiterMapping.get(modelName)!;
  }
}
