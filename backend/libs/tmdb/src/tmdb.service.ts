import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
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
    // TODO: GET /movie/popular?page={page} y mapear `results` a TmdbMovie[].
    throw new Error(`Not implemented: listPopularMovies(${page})`);
  }
}
