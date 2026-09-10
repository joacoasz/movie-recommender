import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

export function Movies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    api
      .get<Movie[]>('/movies')
      .then((res) => setMovies(res.data))
      .catch(() => setError('No se pudieron cargar las películas'));
  }, []);

  const like = async (movie: Movie) => {
    await api.post('/likes', {
      tmdbMovieId: movie.id,
      title: movie.title,
      posterPath: movie.posterPath,
    });
    setLikedIds((prev) => new Set(prev).add(movie.id));
  };

  return (
    <section className="page">
      <div className="page-header">
        <h1>Películas</h1>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="card-grid">
        {movies.map((movie) => {
          const liked = likedIds.has(movie.id);
          return (
            <div className="movie-card" key={movie.id}>
              {movie.posterPath ? (
                <img
                  className="movie-poster"
                  src={`${TMDB_IMAGE_BASE}${movie.posterPath}`}
                  alt={movie.title}
                  loading="lazy"
                />
              ) : (
                <div className="movie-poster" />
              )}
              <div className="movie-body">
                <span className="movie-title">{movie.title}</span>
                <button
                  className={`btn btn-small ${liked ? 'btn-liked' : 'btn-primary'}`}
                  disabled={liked}
                  onClick={() => like(movie)}
                >
                  {liked ? '✓ Agregada' : 'Me gusta'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
