import { Module } from '@nestjs/common';
import { GroqModule } from '@app/groq';
import { RecommendationConsumerController } from './recommendation-consumer.controller';
import { RecommendationRateLimiterService } from './recommendation-rate-limiter.service';

@Module({
  imports: [GroqModule],
  controllers: [RecommendationConsumerController],
  providers: [RecommendationRateLimiterService],
})
export class RecommendationConsumerModule {}
