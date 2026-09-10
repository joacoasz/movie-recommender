import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MovieDetailModal } from '../components/MovieDetailModal';

interface Recommendation {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  title: string | null;
  reason: string | null;
  posterPath: string | null;
  tmdbMovieId: number | null;
  createdAt: string;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

const STATUS_LABEL: Record<Recommendation['status'], string> = {
  PENDING: 'Generando',
  COMPLETED: 'Lista',
  FAILED: 'Falló',
};

const STATUS_BADGE_CLASS: Record<Recommendation['status'], string> = {
  PENDING: 'badge-pending',
  COMPLETED: 'badge-completed',
  FAILED: 'badge-failed',
};

export function Recommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

  const load = () => {
    api.get<Recommendation[]>('/recommendations').then((res) => setRecommendations(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const requestRecommendation = async () => {
    setRequesting(true);
    try {
      await api.post('/recommendations');
      load();
    } finally {
      setRequesting(false);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <h1>Recomendaciones</h1>
        <button className="btn btn-primary" onClick={requestRecommendation} disabled={requesting}>
          {requesting ? 'Solicitando...' : 'Pedir una recomendación'}
        </button>
      </div>
      {recommendations.length === 0 ? (
        <p className="empty-state">Todavía no pediste ninguna recomendación.</p>
      ) : (
        <div className="recommendation-list">
          {recommendations.map((rec) => {
            const clickable = rec.tmdbMovieId !== null;
            return (
              <div
                className={`recommendation-card${clickable ? ' recommendation-card-clickable' : ''}`}
                key={rec.id}
                onClick={clickable ? () => setSelectedMovieId(rec.tmdbMovieId) : undefined}
              >
                {rec.posterPath ? (
                  <img
                    className="recommendation-poster"
                    src={`${TMDB_IMAGE_BASE}${rec.posterPath}`}
                    alt={rec.title ?? ''}
                    loading="lazy"
                  />
                ) : (
                  <div className="recommendation-poster" />
                )}
                <div className="recommendation-body">
                  <span className={`badge ${STATUS_BADGE_CLASS[rec.status]}`}>{STATUS_LABEL[rec.status]}</span>
                  <span className="recommendation-title">{rec.title ?? 'Generando recomendación...'}</span>
                  {rec.reason && <span className="recommendation-reason">{rec.reason}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedMovieId && (
        <MovieDetailModal movieId={selectedMovieId} onClose={() => setSelectedMovieId(null)} />
      )}
    </section>
  );
}
