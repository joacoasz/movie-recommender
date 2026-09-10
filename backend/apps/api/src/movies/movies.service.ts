import { Injectable } from '@nestjs/common';
import { TmdbService } from '@app/tmdb';

@Injectable()
export class MoviesService {
  constructor(private readonly tmdbService: TmdbService) {}

  list(page: number) {
    return this.tmdbService.listPopularMovies(page);
  }
}
