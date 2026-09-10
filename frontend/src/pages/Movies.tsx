import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
}

export function Movies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);

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
  };

  return (
    <section>
      <h1>Películas</h1>
      {error && <p role="alert">{error}</p>}
      <ul>
        {movies.map((movie) => (
          <li key={movie.id}>
            {movie.title}
            <button onClick={() => like(movie)}>Me gusta</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
