import type { ReactNode } from 'react';

export type AlertVariant = 'error' | 'success' | 'info';

export interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
  role?: string;
}

const variantClass: Record<AlertVariant, string> = {
  error: 'department-alert department-alert--error',
  success: 'department-alert department-alert--success',
  info: 'department-alert department-alert--info',
};

export function Alert({ variant, children, role = 'alert' }: AlertProps) {
  return (
    <div className={variantClass[variant]} role={role}>
      {children}
    </div>
  );
}
