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
  /** Опциональное действие в шапке справа (кнопка и т.д.) */
  action?: ReactNode;
}

export function SectionCard({ icon, title, children, className, action }: SectionCardProps) {
  const cn = ['entity-view-card', 'ed-card', className].filter(Boolean).join(' ');
  return (
    <section className={cn}>
      <div className="ed-section-header">
        <h2 className="entity-view-card-title ed-section-title">
          {icon}
          {title}
        </h2>
        {action != null ? <div className="ed-section-action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
