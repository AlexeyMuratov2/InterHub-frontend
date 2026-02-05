import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '../../shared/ui';

export interface EntityViewLayoutProps {
  loading?: boolean;
  notFound?: boolean;
  error?: string | null;
  notFoundMessage?: string;
  errorMessage?: string;
  backTo: string;
  backLabel: string;
  viewOnly?: boolean;
  viewOnlyMessage?: string;
  title: string;
  onEditClick?: () => void;
  editLabel?: string;
  children: ReactNode;
}

export function EntityViewLayout({
  loading,
  notFound,
  error,
  notFoundMessage,
  errorMessage,
  backTo,
  backLabel,
  viewOnly,
  viewOnlyMessage,
  title,
  onEditClick,
  editLabel,
  children,
}: EntityViewLayoutProps) {
  if (loading) {
    return (
      <div className="entity-view-page department-form-page">
        <div className="entity-view-card">
          <p style={{ margin: 0, color: '#6b7280' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (notFound || (error != null && error !== '')) {
    const message = notFound ? notFoundMessage : errorMessage ?? error ?? '';
    return (
      <div className="entity-view-page department-form-page">
        {message && (
          <Alert variant="error" role="alert">
            {message}
          </Alert>
        )}
        <Link to={backTo} className="btn-secondary">
          {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="entity-view-page department-form-page">
      {viewOnly && viewOnlyMessage != null && (
        <Alert variant="info" role="status">
          {viewOnlyMessage}
        </Alert>
      )}
      <header className="entity-view-header">
        <h1 className="entity-view-title">{title}</h1>
        <div className="entity-view-actions department-form-actions">
          {onEditClick != null && editLabel != null && (
            <button type="button" className="btn-primary" onClick={onEditClick}>
              {editLabel}
            </button>
          )}
          <Link to={backTo} className="btn-secondary">
            {backLabel}
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
