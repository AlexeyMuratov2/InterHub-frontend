import type { ReactNode } from 'react';

export interface FormGroupProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
  hint?: ReactNode;
}

export function FormGroup({ label, htmlFor, error, children, required, hint }: FormGroupProps) {
  return (
    <div className="form-group">
      <label htmlFor={htmlFor}>
        {label}
        {required && ' *'}
      </label>
      {children}
      {hint != null && <small className="form-field-hint" style={{ color: '#718096', fontSize: '0.8rem' }}>{hint}</small>}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
