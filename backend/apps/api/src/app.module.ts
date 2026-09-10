import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@app/database';
import { TmdbModule } from '@app/tmdb';
import { AuthModule } from './auth/auth.module';
import { MoviesModule } from './movies/movies.module';
import { LikesModule } from './likes/likes.module';
import { RecommendationsModule } from './recommendations/recommendations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TmdbModule,
    AuthModule,
    MoviesModule,
    LikesModule,
    RecommendationsModule,
  ],
})
export class AppModule {}
