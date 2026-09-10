import { Module } from '@nestjs/common';
import { TmdbModule } from '@app/tmdb';
import { AuthModule } from '../auth/auth.module';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';

@Module({
  imports: [TmdbModule, AuthModule],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
