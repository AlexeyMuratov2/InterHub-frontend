import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface FormActionsProps {
  submitLabel: ReactNode;
  submitting: boolean;
  cancelLabel: ReactNode;
  /** When set, cancel is a button calling onCancel; otherwise use cancelTo link. */
  onCancel?: () => void;
  cancelTo?: string;
}

export function FormActions({ submitLabel, submitting, cancelLabel, onCancel, cancelTo }: FormActionsProps) {
  return (
    <div className="department-form-actions">
      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitLabel}
      </button>
      {onCancel != null ? (
        <button type="button" className="btn-secondary" disabled={submitting} onClick={onCancel}>
          {cancelLabel}
        </button>
      ) : cancelTo != null ? (
        <Link to={cancelTo} className="btn-secondary">
          {cancelLabel}
        </Link>
      ) : null}
    </div>
  );
}
