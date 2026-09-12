import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { RecommendationEventsService } from './recommendation-events.service';

@Module({
  imports: [
    AuthModule,
    ClientsModule.registerAsync([
      {
        name: 'RECOMMENDATIONS_QUEUE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.getOrThrow<string>('RABBITMQ_URL')],
            queue: 'recommendations',
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, RecommendationEventsService],
})
export class RecommendationsModule {}
