import { Injectable } from '@nestjs/common';
import { TmdbService } from '@app/tmdb';

@Injectable()
export class MoviesService {
  constructor(private readonly tmdbService: TmdbService) {}

  list(page: number, query?: string) {
    if (query && query.trim().length > 0) {
      return this.tmdbService.searchMovies(query.trim(), page);
    }

    return this.tmdbService.listPopularMovies(page);
  }
}
