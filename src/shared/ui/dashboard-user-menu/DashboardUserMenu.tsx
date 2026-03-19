import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

type DashboardUserMenuProps = {
  userName?: string;
  userEmail?: string;
  profilePath?: string;
  profileLabel?: string;
  dashboardSwitchPath?: string;
  dashboardSwitchLabel?: string;
  logoutLabel: string;
  onLogout: () => Promise<void> | void;
};

function getUserInitials(userName?: string, userEmail?: string): string {
  const source = userName?.trim() || userEmail?.trim() || 'User';
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join('');
}

export function DashboardUserMenu({
  userName,
  userEmail,
  profilePath,
  profileLabel = 'Profile',
  dashboardSwitchPath,
  dashboardSwitchLabel = 'Choose dashboard',
  logoutLabel,
  onLogout,
}: DashboardUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = userName?.trim() || userEmail?.trim() || 'User';
  const initials = getUserInitials(userName, userEmail);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="app-dashboard-header-user-menu" ref={menuRef}>
      <button
        type="button"
        className="app-dashboard-header-user-menu-trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="app-dashboard-header-avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="app-dashboard-header-user-name">{displayName}</span>
        <span className="app-dashboard-header-user-menu-arrow" aria-hidden="true">
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="app-dashboard-header-user-menu-dropdown" role="menu">
          <div className="app-dashboard-header-user-menu-summary">
            <p className="app-dashboard-header-user-menu-summary-name">{displayName}</p>
            {userEmail ? (
              <p className="app-dashboard-header-user-menu-summary-email">{userEmail}</p>
            ) : null}
          </div>
          {profilePath ? (
            <Link
              to={profilePath}
              className="app-dashboard-header-user-menu-item"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              {profileLabel}
            </Link>
          ) : null}
          {dashboardSwitchPath ? (
            <Link
              to={dashboardSwitchPath}
              className="app-dashboard-header-user-menu-item"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              {dashboardSwitchLabel}
            </Link>
          ) : null}
          <button
            type="button"
            className="app-dashboard-header-user-menu-item app-dashboard-header-user-menu-item--logout"
            onClick={() => {
              setIsOpen(false);
              void onLogout();
            }}
            role="menuitem"
          >
            {logoutLabel}
          </button>
        </div>
      )}
    </div>
  );
}
