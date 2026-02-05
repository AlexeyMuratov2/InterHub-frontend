import type { ReactNode } from 'react';
import { Alert } from './Alert';

export interface FormPageLayoutProps {
  title: string;
  error?: string | null;
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
}

export function FormPageLayout({ title, error, onSubmit, children }: FormPageLayoutProps) {
  return (
    <div className="department-form-page">
      <h1 className="department-form-title">{title}</h1>
      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}
      <form className="department-form" onSubmit={onSubmit}>
        {children}
      </form>
    </div>
  );
}
