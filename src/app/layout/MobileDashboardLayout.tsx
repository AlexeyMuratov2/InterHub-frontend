import { useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  BookOpen,
  BookMarked,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  MoreHorizontal,
  Settings,
  User,
  UserCog,
  UserPlus,
  Users,
  Users2,
} from 'lucide-react';
import universityLogo from '../../assets/university-logo.png';
import { useAuth } from '../providers';
import { useCanEditInAdmin } from '../hooks/useCanEditInAdmin';
import { useCanManageInvitations } from '../hooks/useCanManageInvitations';
import { useTranslation, LanguageSwitcher } from '../../shared/i18n';
import { getRolesFromUser, getAvailableDashboards } from '../../shared/config';
import { DashboardUserMenu, NotificationBell } from '../../shared/ui';

type DashboardVariant = 'admin' | 'teacher' | 'student';

function navClass(active: boolean): string {
  return 'app-mobile-bottom-nav-item' + (active ? ' app-mobile-bottom-nav-item--active' : '');
}

export function MobileDashboardLayout({ variant }: { variant: DashboardVariant }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const canEdit = useCanEditInAdmin();
  const canManageInvitations = useCanManageInvitations();
  const { t } = useTranslation('dashboard');
  const [moreOpen, setMoreOpen] = useState(false);

  const roles = user ? getRolesFromUser(user) : [];
  const dashboards = getAvailableDashboards(roles);
  const hasMultipleRoles = dashboards.length > 1;

  const prefix =
    variant === 'admin'
      ? '/dashboards/admin'
      : variant === 'teacher'
        ? '/dashboards/teacher'
        : '/dashboards/student';

  let moreActive = false;
  if (variant === 'teacher') {
    moreActive =
      location.pathname.startsWith(prefix + '/absence-requests') ||
      location.pathname.startsWith(prefix + '/profile');
  } else if (variant === 'admin') {
    moreActive =
      location.pathname.startsWith(prefix + '/subjects') ||
      location.pathname.startsWith(prefix + '/invitations') ||
      location.pathname.startsWith(prefix + '/accounts') ||
      location.pathname.startsWith(prefix + '/settings') ||
      location.pathname.startsWith(prefix + '/profile');
  }

  let headerSectionTitle = t('menuDashboard');
  if (variant === 'admin') {
    const p = location.pathname;
    if (p.startsWith(prefix + '/profile')) headerSectionTitle = t('profilePageTitleShort');
    else if (p.startsWith(prefix + '/departments')) headerSectionTitle = t('menuDepartments');
    else if (p.startsWith(prefix + '/programs')) headerSectionTitle = t('menuProgramsAndCurricula');
    else if (p.startsWith(prefix + '/groups')) headerSectionTitle = t('menuGroups');
    else if (p.startsWith(prefix + '/subjects')) headerSectionTitle = t('menuSubjects');
    else if (p.startsWith(prefix + '/invitations')) headerSectionTitle = t('menuInvitations');
    else if (p.startsWith(prefix + '/accounts')) headerSectionTitle = t('accountManagement');
    else if (p.startsWith(prefix + '/settings')) headerSectionTitle = t('menuSystemSettings');
    else if (p.startsWith(prefix + '/implementation')) headerSectionTitle = t('menuImplementation');
  } else if (variant === 'teacher') {
    const p = location.pathname;
    if (p.startsWith(prefix + '/profile')) headerSectionTitle = t('profilePageTitleShort');
    else if (p.startsWith(prefix + '/schedule')) headerSectionTitle = t('menuSchedule');
    else if (p.startsWith(prefix + '/subjects')) headerSectionTitle = t('menuTeacherSubjects');
    else if (p.startsWith(prefix + '/lessons')) headerSectionTitle = t('menuLessons');
    else if (p.startsWith(prefix + '/student-groups')) headerSectionTitle = t('menuTeacherStudentGroups');
    else if (p.startsWith(prefix + '/absence-requests')) headerSectionTitle = t('menuAbsenceRequests');
  } else {
    const p = location.pathname;
    if (p.startsWith(prefix + '/profile')) headerSectionTitle = t('profilePageTitleShort');
    else if (p.startsWith(prefix + '/schedule')) headerSectionTitle = t('menuSchedule');
    else if (p.startsWith(prefix + '/subjects')) headerSectionTitle = t('menuStudentSubjects');
    else if (p.startsWith(prefix + '/lessons')) headerSectionTitle = t('menuLessons');
    else if (p.startsWith(prefix + '/absence-requests')) headerSectionTitle = t('menuStudentAbsenceRequests');
  }

  const showHeaderCreate =
    variant === 'admin' &&
    ((canEdit && location.pathname.startsWith(prefix + '/departments')) ||
      (canEdit && location.pathname.startsWith(prefix + '/programs')) ||
      (canEdit && location.pathname.startsWith(prefix + '/groups')) ||
      (canEdit && location.pathname.startsWith(prefix + '/subjects')) ||
      (canEdit && location.pathname.startsWith(prefix + '/settings')) ||
      (location.pathname.startsWith(prefix + '/invitations') && canManageInvitations));

  const headerCreateLink = (() => {
    const p = location.pathname;
    if (p.startsWith(prefix + '/departments')) return prefix + '/departments/new';
    if (p.startsWith(prefix + '/programs')) return prefix + '/programs/new';
    if (p.startsWith(prefix + '/groups')) return prefix + '/groups/new';
    if (p.startsWith(prefix + '/subjects')) return prefix + '/subjects/new';
    if (p.startsWith(prefix + '/settings')) return prefix + '/settings/years/new';
    return prefix + '/invitations/new';
  })();

  type TabItem = { to: string; end: boolean; icon: LucideIcon; label: string; key: string };

  let primaryTabs: TabItem[] = [];
  let moreLinks: { to: string; icon: LucideIcon; label: string }[] = [];

  if (variant === 'student') {
    primaryTabs = [
      { to: prefix + '/schedule', end: false, icon: Calendar, label: t('menuSchedule'), key: 'sched' },
      { to: prefix + '/subjects', end: false, icon: BookOpen, label: t('menuStudentSubjects'), key: 'subj' },
      { to: prefix + '/lessons', end: false, icon: BookMarked, label: t('menuLessons'), key: 'less' },
      {
        to: prefix + '/absence-requests',
        end: false,
        icon: ClipboardList,
        label: t('menuStudentAbsenceRequests'),
        key: 'abs',
      },
      { to: prefix + '/profile', end: true, icon: User, label: t('profilePageTitleShort'), key: 'prof' },
    ];
  } else if (variant === 'teacher') {
    primaryTabs = [
      { to: prefix + '/schedule', end: false, icon: Calendar, label: t('menuSchedule'), key: 'sched' },
      { to: prefix + '/subjects', end: false, icon: BookOpen, label: t('menuTeacherSubjects'), key: 'subj' },
      { to: prefix + '/student-groups', end: false, icon: Users2, label: t('menuTeacherStudentGroups'), key: 'grp' },
      { to: prefix + '/lessons', end: false, icon: BookMarked, label: t('menuLessons'), key: 'less' },
      { to: '__more__', end: true, icon: MoreHorizontal, label: '…', key: 'more' },
    ];
    moreLinks = [
      { to: prefix + '/absence-requests', icon: ClipboardList, label: t('menuAbsenceRequests') },
      { to: prefix + '/profile', icon: User, label: t('profilePageTitleShort') },
    ];
  } else {
    primaryTabs = [
      {
        to: prefix + '/departments',
        end: false,
        icon: Building2,
        label: t('menuDepartments'),
        key: 'dept',
      },
      { to: prefix + '/programs', end: false, icon: BookOpen, label: t('menuProgramsAndCurricula'), key: 'prog' },
      { to: prefix + '/groups', end: false, icon: Users, label: t('menuGroups'), key: 'grp' },
      {
        to: prefix + '/implementation',
        end: false,
        icon: Calendar,
        label: t('menuImplementation'),
        key: 'impl',
      },
      { to: '__more__', end: true, icon: MoreHorizontal, label: '…', key: 'more' },
    ];
    moreLinks = [
      { to: prefix, icon: LayoutDashboard, label: t('menuDashboard') },
      { to: prefix + '/subjects', icon: BookMarked, label: t('menuSubjects') },
      { to: prefix + '/invitations', icon: UserPlus, label: t('menuInvitations') },
      { to: prefix + '/accounts', icon: UserCog, label: t('menuAccounts') },
      { to: prefix + '/settings', icon: Settings, label: t('menuSystemSettings') },
      { to: prefix + '/profile', icon: User, label: t('profilePageTitleShort') },
    ];
  }

  return (
    <div className="app-dashboard-layout app-dashboard-layout--mobile">
      <div className="app-dashboard-body">
        <header className="app-dashboard-header app-dashboard-header--mobile">
          <div className="app-dashboard-header-left" style={{ minWidth: 0, flex: 1 }}>
            <img
              src={universityLogo}
              alt=""
              width={32}
              height={32}
              style={{ borderRadius: 8, flexShrink: 0, background: '#2563eb', padding: 6 }}
            />
            <span className="app-dashboard-header-section">{headerSectionTitle}</span>
            {showHeaderCreate && (
              <Link to={headerCreateLink} className="app-dashboard-header-create" style={{ flexShrink: 0 }}>
                <span className="app-dashboard-header-create-icon">+</span>
                <span className="app-dashboard-header-create-text">{t('headerCreate')}</span>
              </Link>
            )}
          </div>
          <div className="app-dashboard-header-right">
            <LanguageSwitcher className="app-dashboard-header-lang" variant="select" />
            <NotificationBell dashboardPrefix={prefix} />
            <DashboardUserMenu
              userName={user?.fullName}
              userEmail={user?.email}
              profilePath={prefix + '/profile'}
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

        <nav className="app-mobile-bottom-nav" aria-label="Main">
          {primaryTabs.map((tab) => {
            if (tab.to === '__more__') {
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={navClass(moreOpen || moreActive)}
                  onClick={() => setMoreOpen(true)}
                  aria-expanded={moreOpen}
                >
                  <tab.icon strokeWidth={2} />
                  <span>{tab.label}</span>
                </button>
              );
            }
            return (
              <NavLink
                key={tab.key}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) => navClass(isActive)}
              >
                <tab.icon strokeWidth={2} />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {moreOpen && (variant === 'teacher' || variant === 'admin') && (
        <>
          <button
            type="button"
            className="app-mobile-more-backdrop"
            aria-label="Close"
            onClick={() => setMoreOpen(false)}
          />
          <div className="app-mobile-more-sheet" role="dialog" aria-label={t('selectTitle')}>
            <h3>{t('selectTitle')}</h3>
            {moreLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="app-mobile-more-link"
                onClick={() => setMoreOpen(false)}
              >
                <l.icon size={20} strokeWidth={2} />
                {l.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
