import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function NavBar() {
  const { token, logout } = useAuth();

  if (!token) {
    return null;
  }

  return (
    <nav className="navbar">
      <span className="navbar-brand">🎬 Movie Recommender</span>
      <div className="navbar-links">
        <Link to="/movies">Películas</Link>
        <Link to="/likes">Me gusta</Link>
        <Link to="/recommendations">Recomendaciones</Link>
        <button className="btn btn-outline btn-small" onClick={logout}>
          Salir
        </button>
      </div>
    </nav>
  );
}
