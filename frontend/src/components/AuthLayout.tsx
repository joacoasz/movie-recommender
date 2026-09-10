import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

const SHOWCASE_POSTERS = [
  { icon: '🚀', gradient: 'linear-gradient(160deg, #f97316, #7c2d12)' },
  { icon: '🔪', gradient: 'linear-gradient(160deg, #64748b, #1e293b)' },
  { icon: '❤️', gradient: 'linear-gradient(160deg, #ec4899, #831843)' },
  { icon: '🧙', gradient: 'linear-gradient(160deg, #a855f7, #4c1d95)' },
  { icon: '🤖', gradient: 'linear-gradient(160deg, #38bdf8, #0c4a6e)' },
  { icon: '🏆', gradient: 'linear-gradient(160deg, #facc15, #92400e)' },
  { icon: '👻', gradient: 'linear-gradient(160deg, #94a3b8, #334155)' },
  { icon: '🎭', gradient: 'linear-gradient(160deg, #f472b6, #701a75)' },
  { icon: '💥', gradient: 'linear-gradient(160deg, #fb923c, #7c2d12)' },
  { icon: '🐉', gradient: 'linear-gradient(160deg, #34d399, #065f46)' },
  { icon: '🕵️', gradient: 'linear-gradient(160deg, #818cf8, #312e81)' },
  { icon: '🎪', gradient: 'linear-gradient(160deg, #fb7185, #881337)' },
];

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className="auth-showcase">
        <div className="auth-poster-grid" aria-hidden="true">
          {SHOWCASE_POSTERS.map((poster, index) => (
            <div key={index} className="auth-poster" style={{ background: poster.gradient }}>
              <span>{poster.icon}</span>
            </div>
          ))}
        </div>
        <div className="auth-showcase-overlay" aria-hidden="true" />
        <div className="auth-showcase-content">
          <span className="auth-showcase-badge">🎬 Movie Recommender</span>
          <h1>Tu próxima maratón empieza acá</h1>
          <p>Descubrí películas, guardá tus favoritas y dejá que una IA arme recomendaciones a tu medida.</p>
        </div>
      </div>
      <div className="auth-form-panel">
        <div className="auth-mobile-brand">
          <span aria-hidden="true">🎬</span>
          <strong>Movie Recommender</strong>
        </div>
        {children}
      </div>
    </div>
  );
}

export function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
