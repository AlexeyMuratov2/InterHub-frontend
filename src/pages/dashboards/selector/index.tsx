import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers';
import {
  getRolesFromUser,
  getAvailableDashboards,
  getDefaultDashboardPath,
  type DashboardKind,
} from '../../../shared/config';
import { useTranslation } from '../../../shared/i18n';
import { LanguageSwitcher } from '../../../shared/i18n';

const DASHBOARD_KEYS: Record<DashboardKind, string> = {
  admin: 'adminDashboard',
  teacher: 'teacherDashboard',
  student: 'studentDashboard',
};

/** Страница выбора дашборда — показывается при нескольких ролях. При одной роли — редирект на дашборд. */
export function DashboardSelectorPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  const roles = user ? getRolesFromUser(user) : [];
  const dashboards = getAvailableDashboards(roles);
  const defaultPath = getDefaultDashboardPath(roles);

  useEffect(() => {
    if (loading || !user) return;
    if (defaultPath) {
      navigate(defaultPath, { replace: true });
    }
  }, [loading, user, defaultPath, navigate]);

  if (loading) {
    return (
      <div className="dashboard-selector">
        <LanguageSwitcher className="dashboard-selector-lang" variant="buttons" />
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (defaultPath) {
    return (
      <div className="dashboard-selector">
        <LanguageSwitcher className="dashboard-selector-lang" variant="buttons" />
        <p>{t('redirecting')}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-selector">
      <div className="dashboard-selector-header">
        <h1>{t('selectTitle')}</h1>
        <LanguageSwitcher className="dashboard-selector-lang" variant="buttons" />
      </div>
      <p>{t('selectDescription')}</p>
      <ul>
        {dashboards.map((kind) => (
          <li key={kind}>
            <Link to={`/dashboards/${kind}`}>{t(DASHBOARD_KEYS[kind])}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
