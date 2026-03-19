import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  BookMarked,
  ClipboardList,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import universityLogo from '../../assets/university-logo.png';
import { useAuth } from '../providers';
import { useTranslation, LanguageSwitcher } from '../../shared/i18n';
import { getRolesFromUser, getAvailableDashboards } from '../../shared/config';
import { DashboardUserMenu, NotificationBell } from '../../shared/ui';

const STUDENT_MENU: Array<{
  path: string;
  labelKey: string;
  end: boolean;
  icon: LucideIcon;
}> = [
  { path: '/dashboards/student', labelKey: 'menuDashboard', end: true, icon: LayoutDashboard },
  { path: '/dashboards/student/schedule', labelKey: 'menuSchedule', end: false, icon: Calendar },
  { path: '/dashboards/student/lessons', labelKey: 'menuLessons', end: false, icon: BookMarked },
  { path: '/dashboards/student/subjects', labelKey: 'menuStudentSubjects', end: false, icon: BookOpen },
  { path: '/dashboards/student/absence-requests', labelKey: 'menuStudentAbsenceRequests', end: false, icon: ClipboardList },
  { path: '/dashboards/student/profile', labelKey: 'profilePageTitleShort', end: true, icon: User },
] as const;

export function StudentDashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation('dashboard');

  const roles = user ? getRolesFromUser(user) : [];
  const dashboards = getAvailableDashboards(roles);
  const hasMultipleRoles = dashboards.length > 1;

  const isSchedule = location.pathname.startsWith('/dashboards/student/schedule');
  const isProfile = location.pathname.startsWith('/dashboards/student/profile');
  const isSubjects = location.pathname.startsWith('/dashboards/student/subjects');
  const isLessons = location.pathname.startsWith('/dashboards/student/lessons');
  const isAbsenceRequests = location.pathname.startsWith('/dashboards/student/absence-requests');

  const headerSectionTitle = isProfile
    ? t('profilePageTitleShort')
    : isAbsenceRequests
    ? t('menuStudentAbsenceRequests')
    : isSubjects
    ? t('menuStudentSubjects')
    : isLessons
    ? t('menuLessons')
    : isSchedule
    ? t('menuSchedule')
    : t('menuDashboard');

  return (
    <div className="app-dashboard-layout">
      <aside className="app-dashboard-sidebar">
        <div className="app-dashboard-sidebar-brand">
          <div className="app-dashboard-sidebar-brand-logo-wrapper">
            <img src={universityLogo} alt="" className="app-dashboard-sidebar-logo" />
            <span className="app-dashboard-sidebar-title">{t('sidebarBrand')}</span>
          </div>
          <span className="app-dashboard-sidebar-subtitle">{t('sidebarSubtitleStudent')}</span>
        </div>
        <nav className="app-dashboard-sidebar-nav">
          {STUDENT_MENU.map(({ path, labelKey, end, icon: Icon }) => (
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
        <div className="app-dashboard-sidebar-footer">{t('footerStudent')}</div>
      </aside>
      <div className="app-dashboard-body">
        <header className="app-dashboard-header">
          <div className="app-dashboard-header-left">
            <span className="app-dashboard-header-section">{headerSectionTitle}</span>
          </div>
          <div className="app-dashboard-header-right">
            <LanguageSwitcher className="app-dashboard-header-lang" variant="select" />
            <NotificationBell dashboardPrefix="/dashboards/student" />
            <DashboardUserMenu
              userName={user?.fullName}
              userEmail={user?.email}
              profilePath="/dashboards/student/profile"
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
