/**
 * Hero-блок для страниц детального просмотра (офферинг, урок и т.д.).
 * Градиентный фон, иконка, заголовок, опциональные подзаголовки.
 */
import type { ReactNode } from 'react';

export interface PageHeroProps {
  /** Иконка (Lucide или другой компонент) */
  icon: ReactNode;
  /** Основной заголовок */
  title: string;
  /** Подзаголовок (код, дата и т.д.) */
  subtitle?: string | null;
  /** Дополнительная строка (кафедра, мета) */
  meta?: string | null;
  /** Дополнительный контент справа от текста */
  children?: ReactNode;
}

export function PageHero({ icon, title, subtitle, meta, children }: PageHeroProps) {
  return (
    <div className="ed-hero">
      <div className="ed-hero-icon">{icon}</div>
      <div className="ed-hero-text">
        <h1 className="ed-hero-title">{title}</h1>
        {subtitle != null && subtitle !== '' && (
          <span className="ed-hero-subtitle">{subtitle}</span>
        )}
        {meta != null && meta !== '' && (
          <span className="ed-hero-meta">{meta}</span>
        )}
      </div>
      {children}
    </div>
  );
}
