import type { ReactNode } from 'react';

export type AlertVariant = 'error' | 'success' | 'info';

export interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
  role?: string;
  className?: string;
}

const variantClass: Record<AlertVariant, string> = {
  error: 'department-alert department-alert--error',
  success: 'department-alert department-alert--success',
  info: 'department-alert department-alert--info',
};

export function Alert({ variant, children, role = 'alert', className }: AlertProps) {
  const cn = [variantClass[variant], className].filter(Boolean).join(' ');
  return (
    <div className={cn} role={role}>
      {children}
    </div>
  );
}
