import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { PrismaService, RECOMMENDATION_UPDATES_CHANNEL } from '@app/database';
import { GroqService } from '@app/groq';
import { TmdbService } from '@app/tmdb';
import { RecommendationRateLimiterService } from './recommendation-rate-limiter.service';

interface RecommendationRequestedEvent {
  recommendationId: string;
  userId: string;
}

interface UpdatedRecommendation {
  id: string;
  userId: string;
  status: string;
  title: string | null;
  reason: string | null;
  posterPath: string | null;
  tmdbMovieId: number | null;
  overview: string | null;
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

      const updated = await this.prisma.recommendation.update({
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
      await this.notifyRecommendationUpdated(updated);
    } catch {
      const updated = await this.prisma.recommendation.update({
        where: { id: recommendationId },
        data: { status: 'FAILED', completedAt: new Date() },
      });
      await this.notifyRecommendationUpdated(updated);
    }
  }

  private async notifyRecommendationUpdated(recommendation: UpdatedRecommendation) {
    await this.prisma.$executeRaw`SELECT pg_notify(${RECOMMENDATION_UPDATES_CHANNEL}, ${JSON.stringify(recommendation)})`;
  }
}
