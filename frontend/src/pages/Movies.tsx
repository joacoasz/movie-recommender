import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';
const SEARCH_DEBOUNCE_MS = 400;

export function Movies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    setLoading(true);
    const delay = isFirstLoad.current ? 0 : SEARCH_DEBOUNCE_MS;
    isFirstLoad.current = false;

    const timeoutId = setTimeout(() => {
      api
        .get<Movie[]>('/movies', { params: search ? { query: search } : {} })
        .then((res) => {
          setMovies(res.data);
          setError(null);
        })
        .catch(() => setError('No se pudieron cargar las películas'))
        .finally(() => setLoading(false));
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [search]);

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
        <input
          className="search-input"
          type="search"
          placeholder="Buscar películas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="empty-state">Cargando películas...</p>}
      {!loading && !error && movies.length === 0 && (
        <p className="empty-state">No se encontraron películas para "{search}".</p>
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
