/**
 * Ссылка «Назад» для страниц детального просмотра.
 */
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export interface BackLinkProps {
  to: string;
  children: ReactNode;
  /** Иконка слева (например ArrowLeft) */
  icon?: ReactNode;
  className?: string;
}

export function BackLink({ to, children, icon, className }: BackLinkProps) {
  const cn = ['ed-back-link', className].filter(Boolean).join(' ');
  return (
    <Link to={to} className={cn}>
      {icon}
      {children}
    </Link>
  );
}
