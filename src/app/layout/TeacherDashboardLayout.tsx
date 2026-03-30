import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  BookMarked,
  Users2,
  ClipboardList,
  User,
  Menu,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import universityLogo from '../../assets/university-logo.png';
import { useAuth } from '../providers';
import { useTranslation, LanguageSwitcher } from '../../shared/i18n';
import { getRolesFromUser, getAvailableDashboards } from '../../shared/config';
import { DashboardUserMenu, NotificationBell } from '../../shared/ui';
import { useDashboardNavDrawer } from './useDashboardNavDrawer';

const TEACHER_MENU: Array<{
  path: string;
  labelKey: string;
  end: boolean;
  icon: LucideIcon;
}> = [
  { path: '/dashboards/teacher', labelKey: 'menuDashboard', end: true, icon: LayoutDashboard },
  { path: '/dashboards/teacher/schedule', labelKey: 'menuSchedule', end: false, icon: Calendar },
  { path: '/dashboards/teacher/subjects', labelKey: 'menuTeacherSubjects', end: false, icon: BookOpen },
  { path: '/dashboards/teacher/lessons', labelKey: 'menuLessons', end: false, icon: BookMarked },
  { path: '/dashboards/teacher/student-groups', labelKey: 'menuTeacherStudentGroups', end: false, icon: Users2 },
  { path: '/dashboards/teacher/absence-requests', labelKey: 'menuAbsenceRequests', end: false, icon: ClipboardList },
  { path: '/dashboards/teacher/profile', labelKey: 'profilePageTitleShort', end: true, icon: User },
] as const;

export function TeacherDashboardLayout() {
  const { navOpen, setNavOpen, rootClass } = useDashboardNavDrawer();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation('dashboard');

  const roles = user ? getRolesFromUser(user) : [];
  const dashboards = getAvailableDashboards(roles);
  const hasMultipleRoles = dashboards.length > 1;

  const isSchedule = location.pathname.startsWith('/dashboards/teacher/schedule');
  const isProfile = location.pathname.startsWith('/dashboards/teacher/profile');
  const isSubjects = location.pathname.startsWith('/dashboards/teacher/subjects');
  const isLessons = location.pathname.startsWith('/dashboards/teacher/lessons');
  const isStudentGroupsList = location.pathname === '/dashboards/teacher/student-groups';
  const isStudentGroupDetail =
    location.pathname.startsWith('/dashboards/teacher/student-groups/') &&
    location.pathname !== '/dashboards/teacher/student-groups';
  const isStudentGroups = isStudentGroupsList || isStudentGroupDetail;
  const isAbsenceRequests = location.pathname.startsWith('/dashboards/teacher/absence-requests');

  const headerSectionTitle = isStudentGroupDetail
    ? t('groupSubjectInfoPageTitle')
    : isProfile
    ? t('profilePageTitleShort')
    : isSubjects
      ? t('menuTeacherSubjects')
      : isLessons
        ? t('menuLessons')
        : isStudentGroups
          ? t('menuTeacherStudentGroups')
          : isAbsenceRequests
            ? t('menuAbsenceRequests')
            : isSchedule
              ? t('menuSchedule')
              : t('menuDashboard');

  return (
    <div className={rootClass}>
      <button
        type="button"
        className="app-dashboard-nav-backdrop"
        aria-label={t('navMenuClose')}
        onClick={() => setNavOpen(false)}
      />
      <aside className="app-dashboard-sidebar">
        <div className="app-dashboard-sidebar-brand">
          <div className="app-dashboard-sidebar-brand-logo-wrapper">
            <img src={universityLogo} alt="" className="app-dashboard-sidebar-logo" />
            <span className="app-dashboard-sidebar-title">{t('sidebarBrand')}</span>
          </div>
          <span className="app-dashboard-sidebar-subtitle">{t('sidebarSubtitleTeacher')}</span>
        </div>
        <nav className="app-dashboard-sidebar-nav">
          {TEACHER_MENU.map(({ path, labelKey, end, icon: Icon }) => (
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
        <div className="app-dashboard-sidebar-footer">{t('footerTeacher')}</div>
      </aside>
      <div className="app-dashboard-body">
        <header className="app-dashboard-header">
          <div className="app-dashboard-header-left">
            <button
              type="button"
              className="app-dashboard-nav-toggle"
              aria-label={navOpen ? t('navMenuClose') : t('navMenuOpen')}
              aria-expanded={navOpen}
              onClick={() => setNavOpen((o) => !o)}
            >
              <Menu size={22} strokeWidth={2} />
            </button>
            <span className="app-dashboard-header-section">{headerSectionTitle}</span>
          </div>
          <div className="app-dashboard-header-right">
            <LanguageSwitcher className="app-dashboard-header-lang" variant="select" />
            <NotificationBell dashboardPrefix="/dashboards/teacher" />
            <DashboardUserMenu
              userName={user?.fullName}
              userEmail={user?.email}
              profilePath="/dashboards/teacher/profile"
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
