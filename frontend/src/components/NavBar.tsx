import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function NavBar() {
  const { token, logout } = useAuth();

  if (!token) {
    return null;
  }

  return (
    <nav>
      <Link to="/movies">Películas</Link>
      <Link to="/likes">Me gusta</Link>
      <Link to="/recommendations">Recomendaciones</Link>
      <button onClick={logout}>Salir</button>
    </nav>
  );
}
