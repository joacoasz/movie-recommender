import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface Recommendation {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  title: string | null;
  reason: string | null;
  createdAt: string;
}

export function Recommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const load = () => {
    api.get<Recommendation[]>('/recommendations').then((res) => setRecommendations(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const requestRecommendation = async () => {
    await api.post('/recommendations');
    load();
  };

  return (
    <section>
      <h1>Recomendaciones</h1>
      <button onClick={requestRecommendation}>Pedir una recomendación</button>
      <ul>
        {recommendations.map((rec) => (
          <li key={rec.id}>
            [{rec.status}] {rec.title ?? 'Generando...'}
            {rec.reason ? ` — ${rec.reason}` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}
