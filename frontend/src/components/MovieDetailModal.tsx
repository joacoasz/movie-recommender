import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface MovieDetail {
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

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface MovieDetailModalProps {
  movieId: number;
  onClose: () => void;
}

export function MovieDetailModal({ movieId, onClose }: MovieDetailModalProps) {
  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDetail(null);
    setError(null);
    api
      .get<MovieDetail>(`/movies/${movieId}`)
      .then((res) => setDetail(res.data))
      .catch(() => setError('No se pudo cargar el detalle de la película'));
  }, [movieId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const year = detail?.releaseDate ? detail.releaseDate.slice(0, 4) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {!error && !detail && <p className="empty-state">Cargando...</p>}

        {detail && (
          <>
            {detail.posterPath ? (
              <img
                className="modal-poster"
                src={`${TMDB_IMAGE_BASE}${detail.posterPath}`}
                alt={detail.title}
              />
            ) : (
              <div className="modal-poster" />
            )}
            <div className="modal-info">
              <h2>{detail.title}</h2>
              <div className="modal-meta">
                {year && <span>{year}</span>}
                {detail.runtimeMinutes ? <span>{detail.runtimeMinutes} min</span> : null}
                {detail.voteAverage > 0 && <span>★ {detail.voteAverage.toFixed(1)}</span>}
              </div>
              {detail.genres.length > 0 && (
                <div className="modal-genres">
                  {detail.genres.map((genre) => (
                    <span key={genre} className="badge badge-genre">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              <p className="modal-overview">{detail.overview || 'Sin descripción disponible.'}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
