import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AuthLayout, LockIcon, UserIcon } from '../components/AuthLayout';

export function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const { data } = await api.post('/auth/register', { username, password });
      login(data.accessToken);
      navigate('/movies');
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear la cuenta'));
    }
  };

  return (
    <AuthLayout>
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="auth-eyebrow">🎟️ Creá tu cuenta</span>
        <h1>Sumate a la función</h1>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="field">
          <label htmlFor="username">Usuario</label>
          <div className="field-input">
            <UserIcon />
            <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <div className="field-input">
            <LockIcon />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <button className="btn btn-primary btn-block" type="submit">
          Registrarme
        </button>
        <p className="auth-switch">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
