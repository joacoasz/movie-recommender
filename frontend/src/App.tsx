import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NavBar } from './components/NavBar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Movies } from './pages/Movies';
import { Likes } from './pages/Likes';
import { Recommendations } from './pages/Recommendations';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <NavBar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/movies" element={<Movies />} />
              <Route path="/likes" element={<Likes />} />
              <Route path="/recommendations" element={<Recommendations />} />
            </Route>
            <Route path="*" element={<Navigate to="/movies" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
