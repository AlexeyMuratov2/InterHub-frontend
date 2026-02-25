/**
 * Секция-карточка с заголовком и иконкой для страниц детального просмотра.
 */
import type { ReactNode } from 'react';

export interface SectionCardProps {
  /** Иконка в заголовке (Lucide) */
  icon: ReactNode;
  /** Заголовок секции */
  title: string;
  children: ReactNode;
  /** Дополнительный класс контейнера */
  className?: string;
}

export function SectionCard({ icon, title, children, className }: SectionCardProps) {
  const cn = ['entity-view-card', 'ed-card', className].filter(Boolean).join(' ');
  return (
    <section className={cn}>
      <h2 className="entity-view-card-title ed-section-title">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}
