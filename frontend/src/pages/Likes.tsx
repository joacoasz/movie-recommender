import { MouseEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import { MovieDetailModal } from '../components/MovieDetailModal';

interface Like {
  id: string;
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

export function Likes() {
  const [likes, setLikes] = useState<Like[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

  const load = () => {
    api.get<Like[]>('/likes').then((res) => setLikes(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (event: MouseEvent, tmdbMovieId: number) => {
    event.stopPropagation();
    await api.delete(`/likes/${tmdbMovieId}`);
    load();
  };

  return (
    <section className="page">
      <div className="page-header">
        <h1>Mis películas que me gustaron</h1>
      </div>
      {likes.length === 0 ? (
        <p className="empty-state">Todavía no marcaste ninguna película. Andá a "Películas" y elegí alguna.</p>
      ) : (
        <div className="card-grid">
          {likes.map((like) => (
            <div className="movie-card" key={like.id} onClick={() => setSelectedMovieId(like.tmdbMovieId)}>
              {like.posterPath ? (
                <img
                  className="movie-poster"
                  src={`${TMDB_IMAGE_BASE}${like.posterPath}`}
                  alt={like.title}
                  loading="lazy"
                />
              ) : (
                <div className="movie-poster" />
              )}
              <div className="movie-body">
                <span className="movie-title">{like.title}</span>
                <button className="btn btn-danger btn-small" onClick={(event) => remove(event, like.tmdbMovieId)}>
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedMovieId && (
        <MovieDetailModal movieId={selectedMovieId} onClose={() => setSelectedMovieId(null)} />
      )}
    </section>
  );
}
