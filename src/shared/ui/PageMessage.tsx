import { Link } from 'react-router-dom';
import { Alert } from './Alert';

export type PageMessageVariant = 'loading' | 'error';

export interface PageMessageProps {
  variant: PageMessageVariant;
  message?: string;
  backTo?: string;
  backLabel?: string;
}

export function PageMessage({ variant, message, backTo, backLabel }: PageMessageProps) {
  return (
    <div className="department-form-page">
      {variant === 'loading' && <p style={{ margin: 0 }}>{message ?? 'Loading…'}</p>}
      {variant === 'error' && (
        <>
          {message != null && (
            <Alert variant="error" role="alert">
              {message}
            </Alert>
          )}
          {backTo != null && backLabel != null && (
            <Link to={backTo} className="btn-secondary">
              {backLabel}
            </Link>
          )}
        </>
      )}
    </div>
  );
}
