import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@app/database';
import { GroqModule } from '@app/groq';
import { RecommendationConsumerModule } from './recommendation/recommendation-consumer.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, GroqModule, RecommendationConsumerModule],
})
export class WorkerModule {}
