import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '@app/database';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('RECOMMENDATIONS_QUEUE') private readonly queue: ClientProxy,
  ) {}

  list(userId: string) {
    return this.prisma.recommendation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async request(userId: string) {
    const recommendation = await this.prisma.recommendation.create({
      data: { userId, status: 'PENDING' },
    });

    this.queue.emit('recommendation.requested', {
      recommendationId: recommendation.id,
      userId,
    });

    return recommendation;
  }
}
