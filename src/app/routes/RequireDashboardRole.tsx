import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers';
import { getRolesFromUser, getAvailableDashboards, type DashboardKind } from '../../shared/config';

interface RequireDashboardRoleProps {
  dashboard: DashboardKind;
  children: React.ReactNode;
}

/** Обёртка: доступ только если у пользователя есть роль для данного дашборда. Иначе редирект на выбор дашборда. */
export function RequireDashboardRole({ dashboard, children }: RequireDashboardRoleProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Загрузка…</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roles = getRolesFromUser(user);
  const available = getAvailableDashboards(roles);
  if (!available.includes(dashboard)) {
    return <Navigate to="/dashboards" replace />;
  }

  return <>{children}</>;
}
