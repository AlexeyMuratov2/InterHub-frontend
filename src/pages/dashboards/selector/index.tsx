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

const DASHBOARD_ICONS: Record<DashboardKind, string> = {
  admin: '⚙️',
  teacher: '👨‍🏫',
  student: '🎓',
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
      <div className="auth-card-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <LanguageSwitcher className="auth-card-lang" variant="select" />
            <div className="auth-card-icon">⏳</div>
            <h2 className="auth-card-title">{t('loading')}</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (defaultPath) {
    return (
      <div className="auth-card-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <LanguageSwitcher className="auth-card-lang" variant="select" />
            <div className="auth-card-icon">↻</div>
            <h2 className="auth-card-title">{t('redirecting')}</h2>
          </div>
        </div>
      </div>
    );
  }

  if (dashboards.length === 0) {
    return (
      <div className="auth-card-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <LanguageSwitcher className="auth-card-lang" variant="select" />
            <div className="auth-card-icon">⚠️</div>
            <h2 className="auth-card-title">Нет доступных дашбордов</h2>
            <p className="auth-card-subtitle">У вас нет ролей, которые дают доступ к дашбордам.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <LanguageSwitcher className="auth-card-lang" variant="select" />
          <div className="auth-card-icon">📊</div>
          <h2 className="auth-card-title">{t('selectTitle')}</h2>
          <p className="auth-card-subtitle">{t('selectDescription')}</p>
        </div>
        <div className="auth-card-body">
          <div className="dashboard-selector-grid">
            {dashboards.map((kind) => (
              <Link
                key={kind}
                to={`/dashboards/${kind}`}
                className="dashboard-selector-card"
              >
                <div className="dashboard-selector-card-icon">{DASHBOARD_ICONS[kind]}</div>
                <div className="dashboard-selector-card-title">{t(DASHBOARD_KEYS[kind])}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
