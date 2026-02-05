import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface FormActionsProps {
  submitLabel: ReactNode;
  submitting: boolean;
  cancelTo: string;
  cancelLabel: ReactNode;
}

export function FormActions({ submitLabel, submitting, cancelTo, cancelLabel }: FormActionsProps) {
  return (
    <div className="department-form-actions">
      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitLabel}
      </button>
      <Link to={cancelTo} className="btn-secondary">
        {cancelLabel}
      </Link>
    </div>
  );
}
