import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers';

interface RequireAuthProps {
  children: React.ReactNode;
}

/** Обёртка: редирект на /login, если пользователь не авторизован */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading, sessionExpired } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Загрузка…</p>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location, sessionExpired }} replace />;
  }

  return <>{children}</>;
}
