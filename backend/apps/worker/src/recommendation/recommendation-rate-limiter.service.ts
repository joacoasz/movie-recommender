import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Bottleneck from 'bottleneck';

@Injectable()
export class RecommendationRateLimiterService {
  private readonly limiter: Bottleneck;

  constructor(configService: ConfigService) {
    const requestsPerMinute = Number(configService.get('GROQ_RATE_LIMIT_PER_MINUTE') ?? 30);

    this.limiter = new Bottleneck({
      reservoir: requestsPerMinute,
      reservoirRefreshAmount: requestsPerMinute,
      reservoirRefreshInterval: 60 * 1000,
      maxConcurrent: 1,
    });
  }

  schedule<T>(task: () => Promise<T>): Promise<T> {
    return this.limiter.schedule(task);
  }
}
