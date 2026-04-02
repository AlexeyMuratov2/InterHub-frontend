import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  Calendar,
  BookMarked,
  UserPlus,
  UserCog,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import universityLogo from '../../assets/university-logo.png';
import { useAuth } from '../providers';
import { useCanEditInAdmin } from '../hooks/useCanEditInAdmin';
import { useCanManageInvitations } from '../hooks/useCanManageInvitations';
import { useTranslation, LanguageSwitcher } from '../../shared/i18n';
import { getRolesFromUser, getAvailableDashboards } from '../../shared/config';
import { DashboardUserMenu } from '../../shared/ui';

const ADMIN_MENU: Array<{
  path: string;
  labelKey: string;
  end: boolean;
  icon: LucideIcon;
}> = [
  { path: '/dashboards/admin', labelKey: 'menuDashboard', end: true, icon: LayoutDashboard },
  { path: '/dashboards/admin/departments', labelKey: 'menuDepartments', end: false, icon: Building2 },
  { path: '/dashboards/admin/programs', labelKey: 'menuProgramsAndCurricula', end: false, icon: BookOpen },
  { path: '/dashboards/admin/groups', labelKey: 'menuGroups', end: false, icon: Users },
  { path: '/dashboards/admin/implementation', labelKey: 'menuImplementation', end: false, icon: Calendar },
  { path: '/dashboards/admin/subjects', labelKey: 'menuSubjects', end: false, icon: BookMarked },
  { path: '/dashboards/admin/invitations', labelKey: 'menuInvitations', end: false, icon: UserPlus },
  { path: '/dashboards/admin/accounts', labelKey: 'menuAccounts', end: false, icon: UserCog },
  { path: '/dashboards/admin/settings', labelKey: 'menuSystemSettings', end: false, icon: Settings },
] as const;

export function DashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const canEdit = useCanEditInAdmin();
  const canManageInvitations = useCanManageInvitations();
  const { t } = useTranslation('dashboard');

  const roles = user ? getRolesFromUser(user) : [];
  const dashboards = getAvailableDashboards(roles);
  const hasMultipleRoles = dashboards.length > 1;

  const isDepartments = location.pathname.startsWith('/dashboards/admin/departments');
  const isPrograms = location.pathname.startsWith('/dashboards/admin/programs');
  const isGroups = location.pathname.startsWith('/dashboards/admin/groups');
  const isSubjects = location.pathname.startsWith('/dashboards/admin/subjects');
  const isInvitations = location.pathname.startsWith('/dashboards/admin/invitations');
  const isAccounts = location.pathname.startsWith('/dashboards/admin/accounts');
  const isProfile = location.pathname.startsWith('/dashboards/admin/profile');
  const isSettings = location.pathname.startsWith('/dashboards/admin/settings');
  const isImplementation = location.pathname.startsWith('/dashboards/admin/implementation');

  const headerSectionTitle = isProfile
    ? t('profilePageTitleShort')
    : isDepartments
    ? t('menuDepartments')
    : isPrograms
      ? t('menuProgramsAndCurricula')
      : isGroups
        ? t('menuGroups')
        : isSubjects
          ? t('menuSubjects')
          : isInvitations
            ? t('menuInvitations')
            : isAccounts
              ? t('accountManagement')
              : isSettings
                ? t('menuSystemSettings')
                : isImplementation
                  ? t('menuImplementation')
                  : t('menuDashboard');

  const showHeaderCreate =
    (canEdit && isDepartments) ||
    (canEdit && isPrograms) ||
    (canEdit && isGroups) ||
    (canEdit && isSubjects) ||
    (canEdit && isSettings) ||
    (isInvitations && canManageInvitations);

  const headerCreateLink = isDepartments
    ? '/dashboards/admin/departments/new'
    : isPrograms
      ? '/dashboards/admin/programs/new'
      : isGroups
        ? '/dashboards/admin/groups/new'
        : isSubjects
          ? '/dashboards/admin/subjects/new'
          : isSettings
            ? '/dashboards/admin/settings/years/new'
            : '/dashboards/admin/invitations/new';

  return (
    <div className="app-dashboard-layout app-dashboard-layout--admin">
      <aside className="app-dashboard-sidebar">
        <div className="app-dashboard-sidebar-brand">
          <div className="app-dashboard-sidebar-brand-logo-wrapper">
            <img src={universityLogo} alt="" className="app-dashboard-sidebar-logo" />
            <span className="app-dashboard-sidebar-title">{t('sidebarBrand')}</span>
          </div>
          <span className="app-dashboard-sidebar-subtitle">{t('sidebarSubtitle')}</span>
        </div>
        <nav className="app-dashboard-sidebar-nav">
          {ADMIN_MENU.map(({ path, labelKey, end, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                'app-dashboard-sidebar-link' + (isActive ? ' app-dashboard-sidebar-link--active' : '')
              }
            >
              <Icon className="app-dashboard-sidebar-link-icon" />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="app-dashboard-sidebar-footer">{t('footerAdmin')}</div>
      </aside>
      <div className="app-dashboard-body">
        <header className="app-dashboard-header">
          <div className="app-dashboard-header-left">
            <span className="app-dashboard-header-section">{headerSectionTitle}</span>
            {showHeaderCreate && (
              <Link to={headerCreateLink} className="app-dashboard-header-create">
                <span className="app-dashboard-header-create-icon">+</span>
                <span>{t('headerCreate')}</span>
              </Link>
            )}
          </div>
          <div className="app-dashboard-header-right">
            <LanguageSwitcher className="app-dashboard-header-lang" variant="select" />
            <DashboardUserMenu
              userName={user?.fullName}
              userEmail={user?.email}
              profilePath="/dashboards/admin/profile"
              profileLabel={t('profilePageTitleShort')}
              dashboardSwitchPath={hasMultipleRoles ? '/dashboards' : undefined}
              dashboardSwitchLabel={t('selectTitle')}
              logoutLabel={t('logout')}
              onLogout={logout}
            />
          </div>
        </header>
        <main className="app-dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
