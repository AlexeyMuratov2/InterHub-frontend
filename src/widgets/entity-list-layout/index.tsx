import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../shared/ui';

export interface EntityListLayoutProps {
  title: string;
  subtitle?: string;
  viewOnly?: boolean;
  viewOnlyMessage?: string;
  actionUnavailable?: boolean;
  actionUnavailableMessage?: string;
  error?: string | null;
  success?: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchAriaLabel?: string;
  createTo?: string;
  createLabel?: string;
  showCreate?: boolean;
  children: ReactNode;
}

export function EntityListLayout({
  title,
  subtitle,
  viewOnly,
  viewOnlyMessage,
  actionUnavailable,
  actionUnavailableMessage,
  error,
  success,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  createTo,
  createLabel,
  showCreate,
  children,
}: EntityListLayoutProps) {
  return (
    <div className="department-page">
      <h1 className="department-page-title">{title}</h1>
      {subtitle != null && <p className="department-page-subtitle">{subtitle}</p>}

      {viewOnly && viewOnlyMessage != null && (
        <Alert variant="info" role="status">
          {viewOnlyMessage}
        </Alert>
      )}
      {actionUnavailable && actionUnavailableMessage != null && (
        <Alert variant="info" role="alert">
          {actionUnavailableMessage}
        </Alert>
      )}
      {error != null && error !== '' && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}
      {success != null && success !== '' && (
        <Alert variant="success" role="status">
          {success}
        </Alert>
      )}

      <div className="department-page-toolbar">
        <div className="department-page-search-wrap">
          <input
            type="search"
            className="department-page-search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={searchAriaLabel ?? searchPlaceholder}
          />
        </div>
        {showCreate && createTo != null && createLabel != null && (
          <Link to={createTo} className="department-page-create">
            <span>+</span>
            {createLabel}
          </Link>
        )}
      </div>

      {children}
    </div>
  );
}
