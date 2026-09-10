import { Module } from '@nestjs/common';
import { GroqModule } from '@app/groq';
import { TmdbModule } from '@app/tmdb';
import { RecommendationConsumerController } from './recommendation-consumer.controller';
import { RecommendationRateLimiterService } from './recommendation-rate-limiter.service';

@Module({
  imports: [GroqModule, TmdbModule],
  controllers: [RecommendationConsumerController],
  providers: [RecommendationRateLimiterService],
})
export class RecommendationConsumerModule {}
