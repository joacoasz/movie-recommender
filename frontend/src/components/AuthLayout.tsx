import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className="auth-showcase">
        <div className="auth-showcase-content">
          <span className="auth-showcase-icon">🎬</span>
          <h1>Movie Recommender</h1>
          <p>Descubrí películas, guardá tus favoritas y dejá que una IA te recomiende tu próxima obsesión.</p>
        </div>
      </div>
      <div className="auth-form-panel">{children}</div>
    </div>
  );
}
