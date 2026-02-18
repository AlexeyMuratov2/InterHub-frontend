import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import universityLogo from '../../assets/university-logo.png';
import { useAuth } from '../providers';
import { useTranslation } from '../../shared/i18n';
import { LanguageSwitcher } from '../../shared/i18n';
import { getRolesFromUser, getAvailableDashboards } from '../../shared/config';

const STUDENT_MENU: Array<{
  path: string;
  labelKey: string;
  end: boolean;
  icon: LucideIcon;
}> = [
  { path: '/dashboards/student', labelKey: 'menuDashboard', end: true, icon: LayoutDashboard },
  { path: '/dashboards/student/schedule', labelKey: 'menuSchedule', end: false, icon: Calendar },
] as const;

/** Layout дашборда студента: сайдбар слева (тёмный), шапка + контент по центру. */
export function StudentDashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation('dashboard');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const roles = user ? getRolesFromUser(user) : [];
  const dashboards = getAvailableDashboards(roles);
  const hasMultipleRoles = dashboards.length > 1;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen]);

  const isSchedule = location.pathname.startsWith('/dashboards/student/schedule');
  const isProfile = location.pathname.startsWith('/dashboards/student/profile');

  const headerSectionTitle = isProfile
    ? t('profilePageTitleShort')
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
            <div className="app-dashboard-header-user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="app-dashboard-header-user-menu-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <span className="app-dashboard-header-avatar" aria-hidden="true">
                  {(user?.fullName ?? user?.email ?? 'S').charAt(0).toUpperCase()}
                </span>
                <span className="app-dashboard-header-user-name">
                  {user?.fullName ?? user?.email ?? 'Student'}
                </span>
                <span className="app-dashboard-header-user-menu-arrow" aria-hidden="true">
                  ▼
                </span>
              </button>
              {userMenuOpen && (
                <div className="app-dashboard-header-user-menu-dropdown">
                  <Link
                    to="/dashboards/student/profile"
                    className="app-dashboard-header-user-menu-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {t('profilePageTitleShort')}
                  </Link>
                  {hasMultipleRoles && (
                    <Link
                      to="/dashboards/selector"
                      className="app-dashboard-header-user-menu-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t('selectTitle')}
                    </Link>
                  )}
                  <button
                    type="button"
                    className="app-dashboard-header-user-menu-item app-dashboard-header-user-menu-item--logout"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                  >
                    {t('logout')}
                  </button>
                </div>
              )}
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
