import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { PrismaService } from '@app/database';
import { GroqService } from '@app/groq';
import { TmdbService } from '@app/tmdb';
import { RecommendationRateLimiterService } from './recommendation-rate-limiter.service';

interface RecommendationRequestedEvent {
  recommendationId: string;
  userId: string;
}

@Controller()
export class RecommendationConsumerController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groqService: GroqService,
    private readonly tmdbService: TmdbService,
    private readonly rateLimiter: RecommendationRateLimiterService,
  ) {}

  @EventPattern('recommendation.requested')
  async handleRecommendationRequested(@Payload() data: RecommendationRequestedEvent, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    await this.rateLimiter.schedule(() => this.processRecommendation(data));

    channel.ack(originalMessage);
  }

  private async processRecommendation({ recommendationId, userId }: RecommendationRequestedEvent) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { likes: true },
    });

    try {
      const result = await this.groqService.generateRecommendation({
        username: user.username,
        likedMovies: user.likes.map((like) => ({ title: like.title })),
      });

      const [match] = await this.tmdbService.searchMovies(result.title).catch(() => []);

      await this.prisma.recommendation.update({
        where: { id: recommendationId },
        data: {
          status: 'COMPLETED',
          title: result.title,
          reason: result.reason,
          tmdbMovieId: match?.id,
          posterPath: match?.posterPath,
          overview: match?.overview,
          completedAt: new Date(),
        },
      });
    } catch {
      await this.prisma.recommendation.update({
        where: { id: recommendationId },
        data: { status: 'FAILED', completedAt: new Date() },
      });
    }
  }
}
