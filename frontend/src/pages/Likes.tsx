import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface Like {
  id: string;
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
}

export function Likes() {
  const [likes, setLikes] = useState<Like[]>([]);

  const load = () => {
    api.get<Like[]>('/likes').then((res) => setLikes(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (tmdbMovieId: number) => {
    await api.delete(`/likes/${tmdbMovieId}`);
    load();
  };

  return (
    <section>
      <h1>Mis películas que me gustaron</h1>
      <ul>
        {likes.map((like) => (
          <li key={like.id}>
            {like.title}
            <button onClick={() => remove(like.tmdbMovieId)}>Quitar</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
