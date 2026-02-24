import { Link } from 'react-router-dom';

export interface SubjectCardProps {
  /** Отображаемое название предмета */
  title: string;
  /** Код предмета */
  subjectCode: string | null;
  /** Подпись и значение строки «Кафедра» (опционально) */
  departmentLabel?: string;
  departmentName?: string | null;
  /** Подпись и значение второй строки (например «Группы» или «Преподаватель») */
  secondaryLabel: string;
  secondaryValue: string;
  /** Ссылка (если задана, карточка рендерится как Link) */
  to?: string;
  className?: string;
  /** Дополнительный контент после строк */
  children?: React.ReactNode;
}

/**
 * Универсальная карточка предмета для списков преподавателя и студента.
 * Переиспользуется на страницах «Мои предметы» (преподаватель) и «Предметы» (студент).
 */
export function SubjectCard({
  title,
  subjectCode,
  departmentLabel,
  departmentName,
  secondaryLabel,
  secondaryValue,
  to,
  className = '',
  children,
}: SubjectCardProps) {
  const content = (
    <>
      <h3 className="subject-card-title">{title}</h3>
      <p className="subject-card-code">{subjectCode ?? '—'}</p>
      {departmentLabel != null && departmentName != null && departmentName !== '' && (
        <div className="subject-card-row">
          <span className="subject-card-label">{departmentLabel}</span>
          <span className="subject-card-value">{departmentName}</span>
        </div>
      )}
      <div className="subject-card-row">
        <span className="subject-card-label">{secondaryLabel}</span>
        <span className="subject-card-value">{secondaryValue}</span>
      </div>
      {children}
    </>
  );

  const baseClass = 'subject-card' + (className ? ` ${className}` : '');

  if (to) {
    return (
      <Link
        to={to}
        className={baseClass}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        {content}
      </Link>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
