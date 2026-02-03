import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import universityLogo from '../../assets/university-logo.png';
import { useAuth } from '../providers';
import { useCanEditInAdmin } from '../hooks/useCanEditInAdmin';
import { useCanManageInvitations } from '../hooks/useCanManageInvitations';
import { useTranslation } from '../../shared/i18n';
import { LanguageSwitcher } from '../../shared/i18n';

const ADMIN_MENU = [
  { path: '/dashboards/admin', labelKey: 'menuDashboard', end: true },
  { path: '/dashboards/admin/departments', labelKey: 'menuDepartments', end: false },
  { path: '/dashboards/admin/programs', labelKey: 'menuProgramsAndCurricula', end: false },
  { path: '/dashboards/admin/invitations', labelKey: 'menuInvitations', end: false },
] as const;

/** Layout дашборда: сайдбар слева (тёмный), шапка + контент по центру. */
export function DashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const canEdit = useCanEditInAdmin();
  const canManageInvitations = useCanManageInvitations();
  const { t } = useTranslation('dashboard');
  const isDepartments = location.pathname.startsWith('/dashboards/admin/departments');
  const isPrograms = location.pathname.startsWith('/dashboards/admin/programs');
  const isInvitations = location.pathname.startsWith('/dashboards/admin/invitations');

  const headerSectionTitle = isDepartments
    ? t('menuDepartments')
    : isPrograms
      ? t('menuProgramsAndCurricula')
      : isInvitations
        ? t('menuInvitations')
        : t('menuDashboard');

  const showHeaderCreate =
    (canEdit && isDepartments) ||
    (canEdit && isPrograms) ||
    (isInvitations && canManageInvitations);

  const headerCreateLink = isDepartments
    ? '/dashboards/admin/departments/new'
    : isPrograms
      ? '/dashboards/admin/programs/new'
      : '/dashboards/admin/invitations/new';

  return (
    <div className="app-dashboard-layout">
      <aside className="app-dashboard-sidebar">
        <div className="app-dashboard-sidebar-brand">
          <img src={universityLogo} alt="" className="app-dashboard-sidebar-logo" />
          <span className="app-dashboard-sidebar-title">{t('sidebarBrand')}</span>
          <span className="app-dashboard-sidebar-subtitle">{t('sidebarSubtitle')}</span>
        </div>
        <nav className="app-dashboard-sidebar-nav">
          {ADMIN_MENU.map(({ path, labelKey, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                'app-dashboard-sidebar-link' + (isActive ? ' app-dashboard-sidebar-link--active' : '')
              }
            >
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>
        <div className="app-dashboard-sidebar-footer">{t('footerAdmin')}</div>
      </aside>
      <div className="app-dashboard-body">
        <header className="app-dashboard-header">
          <div className="app-dashboard-header-left">
            <span className="app-dashboard-header-section">
              {headerSectionTitle}
            </span>
            {showHeaderCreate && (
              <Link to={headerCreateLink} className="app-dashboard-header-create">
                <span className="app-dashboard-header-create-icon">+</span>
                {t('headerCreate')}
              </Link>
            )}
          </div>
          <div className="app-dashboard-header-right">
            <input
              type="search"
              className="app-dashboard-header-search"
              placeholder={t('searchPlaceholder')}
              aria-label="Search"
            />
            <LanguageSwitcher className="app-dashboard-header-lang" variant="select" />
            <div className="app-dashboard-header-user">
              <span className="app-dashboard-header-avatar">A</span>
              <span>{user?.fullName ?? user?.email ?? 'Admin'}</span>
              <button type="button" onClick={() => logout()} className="app-dashboard-header-logout">
                ({t('logout')})
              </button>
            </div>
          </div>
        </header>
        <main className="app-dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
