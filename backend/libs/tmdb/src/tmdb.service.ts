import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
}

interface TmdbApiMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
}

export interface TmdbMovieDetail {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  runtimeMinutes: number | null;
  genres: string[];
  voteAverage: number;
}

interface TmdbApiMovieDetail extends TmdbApiMovie {
  backdrop_path: string | null;
  release_date: string | null;
  runtime: number | null;
  genres: { id: number; name: string }[];
  vote_average: number;
}

@Injectable()
export class TmdbService {
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.client = axios.create({
      baseURL: 'https://api.themoviedb.org/3',
      params: { api_key: this.configService.get<string>('TMDB_API_KEY') },
    });
  }

  async listPopularMovies(page = 1): Promise<TmdbMovie[]> {
    const { data } = await this.client.get<{ results: TmdbApiMovie[] }>('/movie/popular', {
      params: { page, language: 'es-ES' },
    });

    return this.mapMovies(data.results);
  }

  async searchMovies(query: string, page = 1): Promise<TmdbMovie[]> {
    const { data } = await this.client.get<{ results: TmdbApiMovie[] }>('/search/movie', {
      params: { query, page, language: 'es-ES' },
    });

    return this.mapMovies(data.results);
  }

  async getMovieDetails(id: number): Promise<TmdbMovieDetail> {
    const { data } = await this.client.get<TmdbApiMovieDetail>(`/movie/${id}`, {
      params: { language: 'es-ES' },
    });

    return {
      id: data.id,
      title: data.title,
      overview: data.overview,
      posterPath: data.poster_path,
      backdropPath: data.backdrop_path,
      releaseDate: data.release_date,
      runtimeMinutes: data.runtime,
      genres: data.genres.map((genre) => genre.name),
      voteAverage: data.vote_average,
    };
  }

  private mapMovies(movies: TmdbApiMovie[]): TmdbMovie[] {
    return movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path,
    }));
  }
}
